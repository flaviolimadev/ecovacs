<?php

namespace App\Console\Commands;

use App\Models\WebhookEvent;
use App\Models\Deposit;
use App\Models\Ledger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessFailedWebhookCommand extends Command
{
    protected $signature = 'webhook:process-failed {webhook_id?}';
    protected $description = 'Reprocessar webhooks que falharam';

    public function handle()
    {
        $webhookId = $this->argument('webhook_id');

        if ($webhookId) {
            // Processar webhook específico
            $webhook = WebhookEvent::find($webhookId);
            
            if (!$webhook) {
                $this->error("Webhook ID {$webhookId} não encontrado!");
                return 1;
            }

            $this->info("Reprocessando webhook ID {$webhookId}...");
            $this->processWebhook($webhook);
        } else {
            // Processar todos os webhooks com falha
            $webhooks = WebhookEvent::where('status', 'failed')->get();
            
            if ($webhooks->isEmpty()) {
                $this->info('Nenhum webhook com falha encontrado.');
                return 0;
            }

            $this->info("Encontrados {$webhooks->count()} webhooks com falha.");
            
            foreach ($webhooks as $webhook) {
                $this->info("Processando webhook ID {$webhook->id}...");
                $this->processWebhook($webhook);
            }
        }

        $this->info('Concluído!');
        return 0;
    }

    private function processWebhook(WebhookEvent $webhook)
    {
        if (!$webhook->deposit_id) {
            $this->warn("  Webhook {$webhook->id}: Sem depósito vinculado. Pulando...");
            return;
        }

        $deposit = Deposit::find($webhook->deposit_id);
        
        if (!$deposit) {
            $this->error("  Webhook {$webhook->id}: Depósito não encontrado!");
            return;
        }

        if ($deposit->status === 'PAID') {
            $this->warn("  Webhook {$webhook->id}: Depósito já está PAID. Pulando...");
            $webhook->update(['status' => 'processed', 'error_message' => null]);
            return;
        }

        // Verificar status do payload
        $payload = $webhook->payload;
        $providerStatus = strtoupper(
            $payload['status']
            ?? ($payload['event'] ?? '')
            ?? data_get($payload, 'transaction.status', '')
        ) ?: null;

        $statusMap = [
            'OK' => 'PAID',
            'COMPLETED' => 'PAID',
            'APPROVED' => 'PAID',
            'SUCCESS' => 'PAID',
            'TRANSACTION_PAID' => 'PAID',
            'PAID' => 'PAID',
        ];

        $newStatus = $statusMap[$providerStatus] ?? null;

        if ($newStatus !== 'PAID') {
            $this->warn("  Webhook {$webhook->id}: Status não é PAID ({$providerStatus}). Pulando...");
            return;
        }

        // Processar pagamento
        try {
            DB::beginTransaction();

            // Atualizar depósito
            $deposit->update([
                'status' => 'PAID',
                'paid_at' => now(),
            ]);

            $user = $deposit->user;

            // Creditar saldo
            $user->balance += $deposit->amount;
            $user->save();

            // Registrar no ledger
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

            // Atualizar webhook
            $webhook->update([
                'status' => 'processed',
                'processed_at' => now(),
                'error_message' => null,
            ]);

            DB::commit();

            $this->info("  ✅ Webhook {$webhook->id} reprocessado com sucesso!");
            $this->info("     Depósito ID {$deposit->id} marcado como PAID.");
            $this->info("     R$ {$deposit->amount} creditado ao usuário ID {$user->id}.");

            Log::info('Webhook reprocessado manualmente', [
                'webhook_id' => $webhook->id,
                'deposit_id' => $deposit->id,
                'user_id' => $user->id,
                'amount' => $deposit->amount,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            $this->error("  ❌ Erro ao reprocessar webhook {$webhook->id}: {$e->getMessage()}");
            
            $webhook->update([
                'error_message' => $e->getMessage(),
            ]);

            Log::error('Erro ao reprocessar webhook', [
                'webhook_id' => $webhook->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

