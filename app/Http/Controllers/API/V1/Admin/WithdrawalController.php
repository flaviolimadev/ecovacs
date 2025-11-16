<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Models\User;
use App\Services\VizzionPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WithdrawalController extends Controller
{
    /**
     * Listar todos os saques (com filtros)
     */
    public function index(Request $request)
    {
        $query = Withdrawal::with('user:id,name,email');

        // Filtros
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            })->orWhere('cpf', 'ilike', "%{$search}%");
        }

        // Ordenação
        $sortBy = $request->get('sort_by', 'requested_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $withdrawals = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $withdrawals->map(function ($withdrawal) {
                return [
                    'id' => $withdrawal->id,
                    'user' => [
                        'id' => $withdrawal->user->id,
                        'name' => $withdrawal->user->name,
                        'email' => $withdrawal->user->email,
                    ],
                    'amount' => (float) $withdrawal->amount,
                    'fee_amount' => (float) $withdrawal->fee_amount,
                    'net_amount' => (float) $withdrawal->net_amount,
                    'pix_key' => $withdrawal->pix_key,
                    'pix_key_type' => $withdrawal->pix_key_type,
                    'cpf' => $withdrawal->cpf,
                    'status' => $withdrawal->status,
                    'transaction_id' => $withdrawal->transaction_id,
                    'requested_at' => $withdrawal->requested_at?->toIso8601String(),
                    'processed_at' => $withdrawal->processed_at?->toIso8601String(),
                    'error_message' => $withdrawal->error_message,
                ];
            }),
            'meta' => [
                'current_page' => $withdrawals->currentPage(),
                'last_page' => $withdrawals->lastPage(),
                'per_page' => $withdrawals->perPage(),
                'total' => $withdrawals->total(),
            ]
        ]);
    }

    /**
     * Ver detalhes de um saque específico
     */
    public function show($id)
    {
        $withdrawal = Withdrawal::with('user:id,name,email,phone,balance,balance_withdrawn')
            ->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $withdrawal->id,
                'user' => [
                    'id' => $withdrawal->user->id,
                    'name' => $withdrawal->user->name,
                    'email' => $withdrawal->user->email,
                    'phone' => $withdrawal->user->phone,
                    'balance' => (float) $withdrawal->user->balance,
                    'balance_withdrawn' => (float) $withdrawal->user->balance_withdrawn,
                ],
                'amount' => (float) $withdrawal->amount,
                'fee_amount' => (float) $withdrawal->fee_amount,
                'net_amount' => (float) $withdrawal->net_amount,
                'pix_key' => $withdrawal->pix_key,
                'pix_key_type' => $withdrawal->pix_key_type,
                'cpf' => $withdrawal->cpf,
                'status' => $withdrawal->status,
                'transaction_id' => $withdrawal->transaction_id,
                'raw_response' => $withdrawal->raw_response,
                'requested_at' => $withdrawal->requested_at?->toIso8601String(),
                'processed_at' => $withdrawal->processed_at?->toIso8601String(),
                'error_message' => $withdrawal->error_message,
                'created_at' => $withdrawal->created_at->toIso8601String(),
                'updated_at' => $withdrawal->updated_at->toIso8601String(),
            ]
        ]);
    }

    /**
     * Estatísticas de saques
     */
    public function stats()
    {
        $totalWithdrawals = Withdrawal::count();
        $totalRequested = Withdrawal::where('status', 'REQUESTED')->count();
        $totalApproved = Withdrawal::where('status', 'APPROVED')->count();
        $totalPaid = Withdrawal::where('status', 'PAID')->count();
        $totalRejected = Withdrawal::where('status', 'REJECTED')->count();

        $totalAmountRequested = Withdrawal::whereIn('status', ['REQUESTED', 'APPROVED', 'PAID'])
            ->sum('amount');
        $totalAmountPaid = Withdrawal::where('status', 'PAID')->sum('amount');
        $totalFees = Withdrawal::where('status', 'PAID')->sum('fee_amount');

        $withdrawalsToday = Withdrawal::whereDate('requested_at', today())->count();
        $withdrawalsThisWeek = Withdrawal::whereBetween('requested_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $withdrawalsThisMonth = Withdrawal::whereMonth('requested_at', now()->month)->count();

        $amountToday = Withdrawal::whereDate('requested_at', today())
            ->whereIn('status', ['REQUESTED', 'APPROVED', 'PAID'])
            ->sum('amount');

        return response()->json([
            'data' => [
                'total_withdrawals' => $totalWithdrawals,
                'by_status' => [
                    'requested' => $totalRequested,
                    'approved' => $totalApproved,
                    'paid' => $totalPaid,
                    'rejected' => $totalRejected,
                ],
                'amounts' => [
                    'total_requested' => (float) $totalAmountRequested,
                    'total_paid' => (float) $totalAmountPaid,
                    'total_fees' => (float) $totalFees,
                    'today' => (float) $amountToday,
                ],
                'period' => [
                    'today' => $withdrawalsToday,
                    'this_week' => $withdrawalsThisWeek,
                    'this_month' => $withdrawalsThisMonth,
                ],
            ]
        ]);
    }

    /**
     * Aprovar um saque
     */
    public function approve($id)
    {
        $withdrawal = Withdrawal::findOrFail($id);

        if ($withdrawal->status !== 'REQUESTED') {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'Apenas saques com status REQUESTED podem ser aprovados.',
                ]
            ], 400);
        }

        try {
            DB::beginTransaction();

            $withdrawal->markAsApproved();

            // Aqui você pode integrar com a API de pagamento (Vizzion)
            // $result = $this->processPayment($withdrawal);

            DB::commit();

            return response()->json([
                'message' => 'Saque aprovado com sucesso!',
                'data' => [
                    'id' => $withdrawal->id,
                    'status' => $withdrawal->status,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erro ao aprovar saque', [
                'withdrawal_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => [
                    'code' => 'APPROVAL_ERROR',
                    'message' => 'Erro ao aprovar saque: ' . $e->getMessage(),
                ]
            ], 500);
        }
    }

    /**
     * Marcar saque como pago
     */
    public function markAsPaid(Request $request, $id)
    {
        $request->validate([
            'transaction_id' => 'nullable|string',
        ]);

        $withdrawal = Withdrawal::findOrFail($id);

        if (!in_array($withdrawal->status, ['REQUESTED', 'APPROVED'])) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'Apenas saques REQUESTED ou APPROVED podem ser marcados como pagos.',
                ]
            ], 400);
        }

        try {
            DB::beginTransaction();

            $withdrawal->markAsPaid(
                $request->transaction_id ?? 'MANUAL_' . time(),
                []
            );

            DB::commit();

            return response()->json([
                'message' => 'Saque marcado como pago com sucesso!',
                'data' => [
                    'id' => $withdrawal->id,
                    'status' => $withdrawal->status,
                    'processed_at' => $withdrawal->processed_at?->toIso8601String(),
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erro ao marcar saque como pago', [
                'withdrawal_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => [
                    'code' => 'PAYMENT_ERROR',
                    'message' => 'Erro ao marcar saque como pago: ' . $e->getMessage(),
                ]
            ], 500);
        }
    }

    /**
     * Rejeitar um saque
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $withdrawal = Withdrawal::findOrFail($id);

        if (!in_array($withdrawal->status, ['REQUESTED', 'APPROVED'])) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'Apenas saques REQUESTED ou APPROVED podem ser rejeitados.',
                ]
            ], 400);
        }

        try {
            DB::beginTransaction();

            // Reverter saldo do usuário
            $user = $withdrawal->user;
            $user->increment('balance_withdrawn', $withdrawal->amount);

            // Registrar no ledger
            $user->ledger()->create([
                'type' => 'REFUND',
                'reference_type' => 'WITHDRAWAL',
                'reference_id' => $withdrawal->id,
                'description' => 'Estorno de saque rejeitado: ' . $request->reason,
                'amount' => $withdrawal->amount,
                'operation' => 'CREDIT',
                'balance_before' => $user->balance_withdrawn - $withdrawal->amount,
                'balance_after' => $user->balance_withdrawn,
            ]);

            $withdrawal->markAsRejected($request->reason);

            DB::commit();

            return response()->json([
                'message' => 'Saque rejeitado e saldo estornado com sucesso!',
                'data' => [
                    'id' => $withdrawal->id,
                    'status' => $withdrawal->status,
                    'error_message' => $withdrawal->error_message,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erro ao rejeitar saque', [
                'withdrawal_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => [
                    'code' => 'REJECTION_ERROR',
                    'message' => 'Erro ao rejeitar saque: ' . $e->getMessage(),
                ]
            ], 500);
        }
    }

    /**
     * Processar pagamento via Vizzion (manual pelo admin)
     */
    public function processVizzionPayment($id)
    {
        $withdrawal = Withdrawal::with('user')->findOrFail($id);

        if (!in_array($withdrawal->status, ['REQUESTED', 'APPROVED'])) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_STATUS',
                    'message' => 'Apenas saques REQUESTED ou APPROVED podem ser processados via Vizzion.',
                ]
            ], 400);
        }

        try {
            $vizzionService = app(VizzionPayService::class);
            $user = $withdrawal->user;

            // Formatar CPF com pontos e traço
            $cpfDigits = preg_replace('/\D/', '', $withdrawal->cpf);

            // Se CPF estiver inválido ou incompleto, usar um CPF de fallback válido (apenas para o provedor)
            if (strlen($cpfDigits) !== 11) {
                $cpfDigits = '12345678909';
            }
            $cpfFormatted = sprintf(
                '%s.%s.%s-%s',
                substr($cpfDigits, 0, 3),
                substr($cpfDigits, 3, 3),
                substr($cpfDigits, 6, 3),
                substr($cpfDigits, 9, 2)
            );

            // IP fixo para todas as transferências
            $ownerIp = '89.116.74.42';

            // Identificador único da transferência
            $clientIdentifier = 'admin_withdraw_' . $withdrawal->id . '_' . time();

            // Preparar dados no formato EXATO da documentação Vizzion
            $transferData = [
                'identifier' => $clientIdentifier,
                'clientIdentifier' => $clientIdentifier,
                'callbackUrl' => route('api.v1.webhooks.vizzion'),
                'amount' => (float) $withdrawal->net_amount,
                'discountFeeOfReceiver' => false,
                'pix' => [
                    'type' => $withdrawal->pix_key_type,
                    'key' => $withdrawal->pix_key,
                ],
                'owner' => [
                    'ip' => $ownerIp,
                    'name' => $this->normalizeOwnerName($user->name),
                    'document' => [
                        'type' => 'cpf',
                        'number' => $cpfFormatted,
                    ],
                ],
            ];

            Log::info('Admin processando saque via Vizzion', [
                'withdrawal_id' => $withdrawal->id,
                'admin_id' => auth()->id(),
                'payload' => $transferData,
            ]);

            // Chamar API Vizzion para transferência
            $result = $vizzionService->createPixTransfer($transferData);

            if ($result['success']) {
                $rawResponse = $result['raw_response'] ?? [];
                $withdrawData = $rawResponse['withdraw'] ?? [];
                
                DB::beginTransaction();

                $withdrawal->update([
                    'status' => 'APPROVED',
                    'raw_response' => $rawResponse,
                    'transaction_id' => $withdrawData['id'] ?? null,
                    'approved_at' => now(),
                    'error_message' => null,
                ]);

                DB::commit();

                Log::info('Transferência PIX processada com sucesso pelo admin', [
                    'withdrawal_id' => $withdrawal->id,
                    'transaction_id' => $withdrawData['id'] ?? null,
                    'admin_id' => auth()->id(),
                ]);

                return response()->json([
                    'message' => 'Transferência enviada para Vizzion com sucesso!',
                    'data' => [
                        'id' => $withdrawal->id,
                        'status' => $withdrawal->status,
                        'transaction_id' => $withdrawal->transaction_id,
                        'vizzion_status' => $withdrawData['status'] ?? 'unknown',
                    ]
                ]);
            } else {
                // Falha na API Vizzion
                DB::beginTransaction();
                
                $withdrawal->update([
                    'raw_response' => $result,
                    'error_message' => $result['error'] ?? 'Erro desconhecido',
                ]);

                DB::commit();

                Log::warning('Falha ao processar transferência via Vizzion (admin)', [
                    'withdrawal_id' => $withdrawal->id,
                    'admin_id' => auth()->id(),
                    'error' => $result['error'] ?? 'Erro desconhecido',
                    'details' => $result['details'] ?? null,
                ]);

                return response()->json([
                    'error' => [
                        'code' => 'VIZZION_ERROR',
                        'message' => $result['error'] ?? 'Erro ao processar pagamento via Vizzion',
                        'details' => $result['details'] ?? null,
                    ]
                ], 400);
            }

        } catch (\Exception $e) {
            if (isset($withdrawal)) {
                $withdrawal->update([
                    'error_message' => 'Erro ao processar: ' . $e->getMessage(),
                ]);
            }

            Log::error('Exceção ao processar transferência via Vizzion (admin)', [
                'withdrawal_id' => $id,
                'admin_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => 'Erro ao processar pagamento: ' . $e->getMessage(),
                ]
            ], 500);
        }
    }

    /**
     * Normalizar nome do proprietário (remover acentos e caracteres especiais)
     * A Vizzion aceita apenas letras e espaços
     */
    private function normalizeOwnerName(string $name): string
    {
        // Remover acentos
        $name = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);
        
        // Remover caracteres que não são letras ou espaços
        $name = preg_replace('/[^a-zA-Z\s]/', '', $name);
        
        // Remover espaços extras
        $name = preg_replace('/\s+/', ' ', $name);
        
        // Trim
        $name = trim($name);
        
        // Se o nome ficou vazio, usar um padrão
        if (empty($name)) {
            $name = 'Cliente';
        }
        
        return $name;
    }
}

