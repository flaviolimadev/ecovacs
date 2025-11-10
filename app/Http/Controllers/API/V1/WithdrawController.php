<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Models\Ledger;
use App\Services\VizzionPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class WithdrawController extends Controller
{
    protected VizzionPayService $vizzionService;

    public function __construct(VizzionPayService $vizzionService)
    {
        $this->vizzionService = $vizzionService;
    }

    /**
     * Obter configurações de saque
     */
    public function settings(Request $request)
    {
        $settings = $this->getWithdrawSettings();
        $user = $request->user();

        // Verificar se pode sacar agora
        $validation = $this->validateWithdrawWindow();
        
        // Verificar se já sacou hoje
        $hasWithdrawnToday = Withdrawal::where('user_id', $user->id)
            ->whereDate('requested_at', today())
            ->whereNotIn('status', ['REJECTED', 'CANCELLED'])
            ->exists();

        return response()->json([
            'data' => [
                'min_amount' => (float) $settings['min'],
                'fee_percent' => (float) $settings['fee'],
                'daily_limit' => (int) $settings['daily_limit'],
                'window' => $settings['window'],
                'can_withdraw' => $validation['can_withdraw'],
                'validation_message' => $validation['message'],
                'has_withdrawn_today' => $hasWithdrawnToday,
                'available_balance' => (float) $user->balance_withdrawn,
            ]
        ]);
    }

    /**
     * Solicitar saque
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'cpf' => 'required|string|regex:/^\d{11}$/',
            'pix_key' => 'required|string',
            'pix_key_type' => 'required|in:cpf,email,phone,random',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Dados inválidos',
                    'details' => $validator->errors()
                ]
            ], 422);
        }

        $user = $request->user();
        $amount = (float) $request->amount;

        // Obter configurações
        $settings = $this->getWithdrawSettings();
        $minAmount = (float) $settings['min'];
        $feePercent = (float) $settings['fee'];
        $dailyLimit = (int) $settings['daily_limit'];

        try {
            // 1. Validar janela de saque (dias úteis, horário)
            $windowValidation = $this->validateWithdrawWindow();
            if (!$windowValidation['can_withdraw']) {
                return response()->json([
                    'error' => [
                        'code' => 'WITHDRAW_WINDOW_CLOSED',
                        'message' => $windowValidation['message'],
                    ]
                ], 400);
            }

            // 2. Validar limite diário
            $withdrawalsToday = Withdrawal::where('user_id', $user->id)
                ->whereDate('requested_at', today())
                ->whereNotIn('status', ['REJECTED', 'CANCELLED'])
                ->count();

            if ($withdrawalsToday >= $dailyLimit) {
                return response()->json([
                    'error' => [
                        'code' => 'DAILY_LIMIT_REACHED',
                        'message' => "Você já realizou {$dailyLimit} saque(s) hoje. Tente novamente amanhã.",
                    ]
                ], 400);
            }

            // 3. Validar valor mínimo
            if ($amount < $minAmount) {
                return response()->json([
                    'error' => [
                        'code' => 'AMOUNT_TOO_LOW',
                        'message' => "O valor mínimo para saque é R$ " . number_format($minAmount, 2, ',', '.'),
                    ]
                ], 400);
            }

            // 4. Calcular taxa e valor líquido
            $feeAmount = $amount * $feePercent;
            $netAmount = $amount - $feeAmount;

            // 5. Validar saldo disponível (balance_withdrawn)
            if ($user->balance_withdrawn < $amount) {
                return response()->json([
                    'error' => [
                        'code' => 'INSUFFICIENT_BALANCE',
                        'message' => 'Saldo insuficiente para saque.',
                        'details' => [
                            'available' => (float) $user->balance_withdrawn,
                            'required' => $amount,
                        ]
                    ]
                ], 400);
            }

            // 6. Validar chave PIX
            $pixValidation = $this->validatePixKey($request->pix_key, $request->pix_key_type);
            if (!$pixValidation['valid']) {
                return response()->json([
                    'error' => [
                        'code' => 'INVALID_PIX_KEY',
                        'message' => $pixValidation['message'],
                    ]
                ], 400);
            }

            DB::beginTransaction();

            // 7. Criar registro de saque
            $withdrawal = Withdrawal::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'fee_amount' => $feeAmount,
                'net_amount' => $netAmount,
                'cpf' => $request->cpf,
                'pix_key' => $request->pix_key,
                'pix_key_type' => $request->pix_key_type,
                'status' => 'REQUESTED',
                'requested_at' => now(),
            ]);

            // 8. Debitar saldo do usuário
            $user->balance_withdrawn -= $amount;
            $user->total_withdrawn += $amount;
            $user->save();

            // 9. Registrar no ledger (extrato)
            Ledger::create([
                'user_id' => $user->id,
                'ref_type' => 'WITHDRAW',
                'ref_id' => $withdrawal->id,
                'description' => sprintf(
                    "Saque PIX - R$ %s (Taxa: R$ %s | Líquido: R$ %s)",
                    number_format($amount, 2, ',', '.'),
                    number_format($feeAmount, 2, ',', '.'),
                    number_format($netAmount, 2, ',', '.')
                ),
                'amount' => -$amount, // Negativo pois é débito
            ]);

            DB::commit();

            Log::info('Saque solicitado com sucesso', [
                'withdrawal_id' => $withdrawal->id,
                'user_id' => $user->id,
                'amount' => $amount,
                'net_amount' => $netAmount,
            ]);

            // 10. Tentar processar automaticamente via Vizzion
            $this->processWithdrawal($withdrawal);

            return response()->json([
                'data' => [
                    'id' => $withdrawal->id,
                    'amount' => (float) $amount,
                    'fee_amount' => (float) $feeAmount,
                    'net_amount' => (float) $netAmount,
                    'status' => $withdrawal->status,
                    'requested_at' => $withdrawal->requested_at->toIso8601String(),
                    'message' => 'Saque solicitado com sucesso! Processando transferência...',
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erro ao processar saque', [
                'user_id' => $user->id,
                'amount' => $amount,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => 'Erro ao processar saque',
                ]
            ], 500);
        }
    }

    /**
     * Listar saques do usuário
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $withdrawals = Withdrawal::where('user_id', $user->id)
            ->orderBy('requested_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $withdrawals->map(function ($withdrawal) {
                return [
                    'id' => $withdrawal->id,
                    'amount' => (float) $withdrawal->amount,
                    'fee_amount' => (float) $withdrawal->fee_amount,
                    'net_amount' => (float) $withdrawal->net_amount,
                    'pix_key' => $withdrawal->pix_key,
                    'pix_key_type' => $withdrawal->pix_key_type,
                    'status' => $withdrawal->status,
                    'rejection_reason' => $withdrawal->rejection_reason,
                    'requested_at' => $withdrawal->requested_at->toIso8601String(),
                    'paid_at' => $withdrawal->paid_at?->toIso8601String(),
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
     * Buscar saque específico
     */
    public function show(Request $request, int $id)
    {
        $user = $request->user();
        
        $withdrawal = Withdrawal::where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $withdrawal->id,
                'amount' => (float) $withdrawal->amount,
                'fee_amount' => (float) $withdrawal->fee_amount,
                'net_amount' => (float) $withdrawal->net_amount,
                'cpf' => $withdrawal->cpf,
                'pix_key' => $withdrawal->pix_key,
                'pix_key_type' => $withdrawal->pix_key_type,
                'status' => $withdrawal->status,
                'rejection_reason' => $withdrawal->rejection_reason,
                'requested_at' => $withdrawal->requested_at->toIso8601String(),
                'approved_at' => $withdrawal->approved_at?->toIso8601String(),
                'paid_at' => $withdrawal->paid_at?->toIso8601String(),
            ]
        ]);
    }

    /**
     * Processar saque via Vizzion Pay
     */
    private function processWithdrawal(Withdrawal $withdrawal): void
    {
        try {
            $user = $withdrawal->user;

            // Preparar dados para transferência PIX
            $transferData = [
                'amount' => (float) $withdrawal->net_amount,
                'pixKey' => $withdrawal->pix_key,
                'pixKeyType' => $withdrawal->pix_key_type,
                'description' => "Saque Ecovacs - #{$withdrawal->id}",
                'beneficiary' => [
                    'name' => $user->name,
                    'document' => preg_replace('/\D/', '', $withdrawal->cpf),
                    'documentType' => 'CPF',
                ],
                'callbackUrl' => route('api.v1.webhooks.vizzion'),
            ];

            // Chamar API Vizzion para transferência
            $result = $this->vizzionService->createPixTransfer($transferData);

            if ($result['success']) {
                $withdrawal->update([
                    'status' => 'PROCESSING',
                    'provider_response' => $result['raw_response'] ?? null,
                    'transaction_id' => $result['raw_response']['transactionId'] ?? null,
                    'approved_at' => now(),
                    'processed_at' => now(),
                ]);

                Log::info('Transferência PIX iniciada', [
                    'withdrawal_id' => $withdrawal->id,
                    'transaction_id' => $result['raw_response']['transactionId'] ?? null,
                ]);
            } else {
                $withdrawal->update([
                    'provider_response' => $result,
                ]);

                Log::warning('Falha ao iniciar transferência PIX', [
                    'withdrawal_id' => $withdrawal->id,
                    'error' => $result['error'] ?? 'Erro desconhecido',
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Exceção ao processar transferência', [
                'withdrawal_id' => $withdrawal->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Obter configurações de saque do banco
     */
    private function getWithdrawSettings(): array
    {
        $settings = DB::table('settings')
            ->whereIn('key', [
                'withdraw.window',
                'withdraw.min',
                'withdraw.fee',
                'withdraw.daily_limit_per_user',
            ])
            ->pluck('value', 'key');

        return [
            'window' => json_decode($settings['withdraw.window'] ?? '{"days":["Mon","Tue","Wed","Thu","Fri"],"start":"10:00","end":"17:00"}', true),
            'min' => $settings['withdraw.min'] ?? 50,
            'fee' => $settings['withdraw.fee'] ?? 0.10,
            'daily_limit' => $settings['withdraw.daily_limit_per_user'] ?? 1,
        ];
    }

    /**
     * Validar janela de saque (dias e horários)
     */
    private function validateWithdrawWindow(): array
    {
        $settings = $this->getWithdrawSettings();
        $window = $settings['window'];
        
        $now = Carbon::now();
        $dayOfWeek = $now->format('D'); // Mon, Tue, etc.
        $currentTime = $now->format('H:i');
        
        // Validar dia da semana
        if (!in_array($dayOfWeek, $window['days'])) {
            $dayName = $now->locale('pt_BR')->dayName;
            return [
                'can_withdraw' => false,
                'message' => "Saques não são permitidos aos finais de semana. Hoje é {$dayName}.",
            ];
        }
        
        // Validar horário
        if ($currentTime < $window['start'] || $currentTime >= $window['end']) {
            return [
                'can_withdraw' => false,
                'message' => "Saques só são permitidos de segunda a sexta, das {$window['start']} às {$window['end']}. Horário atual: {$currentTime}.",
            ];
        }
        
        return [
            'can_withdraw' => true,
            'message' => 'Você pode realizar saques no momento.',
        ];
    }

    /**
     * Validar chave PIX
     */
    private function validatePixKey(string $key, string $type): array
    {
        switch ($type) {
            case 'cpf':
                $clean = preg_replace('/\D/', '', $key);
                if (strlen($clean) !== 11) {
                    return ['valid' => false, 'message' => 'CPF inválido'];
                }
                break;

            case 'email':
                if (!filter_var($key, FILTER_VALIDATE_EMAIL)) {
                    return ['valid' => false, 'message' => 'E-mail inválido'];
                }
                break;

            case 'phone':
                $clean = preg_replace('/\D/', '', $key);
                if (strlen($clean) < 10 || strlen($clean) > 11) {
                    return ['valid' => false, 'message' => 'Telefone inválido'];
                }
                break;

            case 'random':
                if (strlen($key) < 32) {
                    return ['valid' => false, 'message' => 'Chave aleatória inválida'];
                }
                break;

            default:
                return ['valid' => false, 'message' => 'Tipo de chave inválido'];
        }

        return ['valid' => true, 'message' => 'Chave válida'];
    }
}

