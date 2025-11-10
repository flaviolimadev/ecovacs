<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Models\WebhookEvent;
use App\Models\Ledger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class WebhookController extends Controller
{
    /**
     * Recebe webhooks da Vizzion e processa pagamentos
     */
    public function vizzion(Request $request)
    {
        try {
            // Capturar headers
            $headers = collect($request->headers->all())
                ->map(function ($values) {
                    return is_array($values) && count($values) === 1 ? $values[0] : $values;
                })
                ->toArray();

            $payload = $request->all();

            // Idempotência por hash do corpo
            $idempotencyHash = hash('sha256', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

            // Extrair possíveis campos padronizados
            $externalId = data_get($payload, 'transaction.id')
                ?? ($payload['transactionId'] ?? ($payload['id'] ?? null));
            $event = $payload['event'] ?? ($payload['status'] ?? data_get($payload, 'transaction.status'));

            Log::info('Webhook Vizzion recebido', [
                'external_id' => $externalId,
                'event' => $event,
                'payload' => $payload,
            ]);

            // Tentar localizar depósito vinculado
            $deposit = $this->findDeposit($payload, $externalId);

            if (!$deposit) {
                Log::warning('Webhook Vizzion: depósito não encontrado', [
                    'external_id' => $externalId,
                    'payload' => $payload,
                ]);
            }

            // Upsert por idempotency_hash
            $webhook = WebhookEvent::firstOrCreate(
                ['idempotency_hash' => $idempotencyHash],
                [
                    'provider' => 'vizzion',
                    'event' => $event,
                    'external_id' => $externalId,
                    'headers' => $headers,
                    'payload' => $payload,
                    'status' => 'received',
                    'deposit_id' => $deposit?->id,
                ]
            );

            // Se já existia, apenas confirma recebimento idempotente
            if (!$webhook->wasRecentlyCreated) {
                Log::info('Webhook Vizzion: já processado', ['webhook_id' => $webhook->id]);
                return response()->json(['message' => 'Webhook já recebido'], 200);
            }

            // Processar o webhook
            $this->processWebhook($webhook, $deposit, $payload);

            return response()->json(['message' => 'Webhook processado com sucesso'], 200);

        } catch (\Exception $e) {
            Log::error('Erro ao processar webhook Vizzion', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erro ao processar webhook',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Tenta localizar o depósito de várias formas
     */
    private function findDeposit(array $payload, ?string $externalId): ?Deposit
    {
        $deposit = null;

        // Tentar por transaction_id
        if ($externalId) {
            $deposit = Deposit::where('transaction_id', $externalId)->first();
        }

        // Tentar por order_id do provedor
        if (!$deposit) {
            $orderIdFromPayload = data_get($payload, 'order.id');
            if ($orderIdFromPayload) {
                $deposit = Deposit::where('order_id', $orderIdFromPayload)->first();
            }
        }

        // Tentar por clientIdentifier/identifier
        if (!$deposit) {
            $clientIdentifier = data_get($payload, 'clientIdentifier') ?? data_get($payload, 'identifier');
            if ($clientIdentifier) {
                // Buscar no raw_response
                $deposit = Deposit::whereJsonContains('raw_response->identifier', $clientIdentifier)
                    ->orWhereJsonContains('raw_response->clientIdentifier', $clientIdentifier)
                    ->first();
            }
        }

        return $deposit;
    }

    /**
     * Processa o webhook e atualiza o depósito
     */
    private function processWebhook(WebhookEvent $webhook, ?Deposit $deposit, array $payload): void
    {
        if (!$deposit) {
            $webhook->update([
                'status' => 'failed',
                'error_message' => 'Depósito não encontrado',
                'processed_at' => now(),
            ]);
            return;
        }

        // Mapear status do provedor para status interno
        $providerStatus = strtoupper(
            $payload['status']
            ?? ($payload['event'] ?? '')
            ?? data_get($payload, 'transaction.status', '')
        ) ?: null;

        if (!$providerStatus) {
            $webhook->update([
                'status' => 'failed',
                'error_message' => 'Status não encontrado no payload',
                'processed_at' => now(),
            ]);
            return;
        }

        $statusMap = [
            'OK' => 'PAID',
            'COMPLETED' => 'PAID',
            'APPROVED' => 'PAID',
            'SUCCESS' => 'PAID',
            'TRANSACTION_PAID' => 'PAID',
            'PAID' => 'PAID',
            'PENDING' => 'PENDING',
            'FAILED' => 'CANCELLED',
            'REJECTED' => 'CANCELLED',
            'CANCELED' => 'CANCELLED',
            'CANCELLED' => 'CANCELLED',
            'EXPIRED' => 'EXPIRED',
        ];

        $newStatus = $statusMap[$providerStatus] ?? null;

        if (!$newStatus) {
            Log::warning('Webhook Vizzion: status desconhecido', [
                'provider_status' => $providerStatus,
                'deposit_id' => $deposit->id,
            ]);
            $webhook->update([
                'status' => 'failed',
                'error_message' => "Status desconhecido: {$providerStatus}",
                'processed_at' => now(),
            ]);
            return;
        }

        $oldStatus = $deposit->status;

        // Se o status é PAID e mudou, processar crédito e comissões
        if ($newStatus === 'PAID' && $oldStatus !== 'PAID') {
            try {
                DB::transaction(function () use ($deposit, $webhook, $newStatus, $providerStatus) {
                    // Recarregar depósito para ter estado atualizado
                    $deposit->refresh();

                    // Verificar novamente se status mudou (evitar race condition)
                    if ($deposit->status === 'PAID') {
                        Log::info('Webhook Vizzion: depósito já está pago (race condition evitada)', [
                            'deposit_id' => $deposit->id,
                        ]);
                        return;
                    }

                    // Atualizar status do depósito
                    $deposit->update([
                        'status' => $newStatus,
                        'paid_at' => now(),
                    ]);

                    $user = $deposit->user;

                    // Creditar saldo investível (balance)
                    $user->balance += $deposit->amount;
                    $user->save();

                    // Registrar no ledger (extrato)
                    $balanceBefore = $user->balance - $deposit->amount; // já foi somado acima
                    Ledger::create([
                        'user_id' => $user->id,
                        'type' => 'DEPOSIT',
                        'reference_type' => 'DEPOSIT',
                        'reference_id' => $deposit->id,
                        'description' => "Depósito via PIX - R$ " . number_format($deposit->amount, 2, ',', '.'),
                        'amount' => $deposit->amount,
                        'operation' => 'CREDIT',
                        'balance_before' => $balanceBefore,
                        'balance_after' => $user->balance,
                    ]);

                    Log::info('Depósito confirmado e creditado', [
                        'deposit_id' => $deposit->id,
                        'user_id' => $user->id,
                        'amount' => $deposit->amount,
                    ]);

                    // TODO: Processar comissões de indicação aqui se aplicável
                    // Para depósitos, as comissões serão processadas quando o usuário
                    // comprar um plano (investment), não no depósito em si
                });

                $webhook->update([
                    'status' => 'processed',
                    'processed_at' => now(),
                ]);

            } catch (\Exception $e) {
                Log::error('Erro ao processar pagamento do depósito', [
                    'deposit_id' => $deposit->id,
                    'error' => $e->getMessage(),
                ]);

                $webhook->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'processed_at' => now(),
                ]);

                throw $e;
            }
        } else {
            // Para outros status, apenas atualizar
            if ($newStatus !== $oldStatus) {
                $deposit->update(['status' => $newStatus]);

                Log::info('Status do depósito atualizado', [
                    'deposit_id' => $deposit->id,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                ]);
            }

            $webhook->update([
                'status' => 'processed',
                'processed_at' => now(),
            ]);
        }
    }
}

