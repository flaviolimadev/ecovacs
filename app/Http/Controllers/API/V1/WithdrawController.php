<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Models\Ledger;
use App\Models\Cycle;
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
            // 1. Validar se o usuário tem pelo menos 1 ciclo (qualquer status)
            $cyclesCount = Cycle::where('user_id', $user->id)->count();

            if ($cyclesCount < 1) {
                return response()->json([
                    'error' => [
                        'code' => 'NO_CYCLES',
                        'message' => 'Você precisa ter pelo menos 1 ciclo/investimento para realizar saques.',
                        'details' => [
                            'cycles_count' => $cyclesCount,
                            'required_cycles' => 1,
                        ]
                    ]
                ], 400);
            }

            // 2. Validar janela de saque (dias úteis, horário)
            $windowValidation = $this->validateWithdrawWindow();
            if (!$windowValidation['can_withdraw']) {
                return response()->json([
                    'error' => [
                        'code' => 'WITHDRAW_WINDOW_CLOSED',
                        'message' => $windowValidation['message'],
                    ]
                ], 400);
            }

            // 3. Validar limite diário
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

            // 4. Validar valor mínimo
            if ($amount < $minAmount) {
                return response()->json([
                    'error' => [
                        'code' => 'AMOUNT_TOO_LOW',
                        'message' => "O valor mínimo para saque é R$ " . number_format($minAmount, 2, ',', '.'),
                    ]
                ], 400);
            }

            // 5. Calcular taxa e valor líquido
            $feeAmount = $amount * $feePercent;
            $netAmount = $amount - $feeAmount;

            // 6. Validar saldo disponível (balance_withdrawn)
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

            // 7. Validar chave PIX
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

            // 8. Criar registro de saque
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

            // 9. Debitar saldo do usuário
            $user->balance_withdrawn -= $amount;
            $user->total_withdrawn += $amount;
            $user->save();

            // 10. Registrar no ledger (extrato)
            Ledger::create([
                'user_id' => $user->id,
                'type' => 'WITHDRAWAL',
                'reference_type' => Withdrawal::class,
                'reference_id' => $withdrawal->id,
                'description' => sprintf(
                    "Saque PIX - R$ %s (Taxa: R$ %s | Líquido: R$ %s)",
                    number_format($amount, 2, ',', '.'),
                    number_format($feeAmount, 2, ',', '.'),
                    number_format($netAmount, 2, ',', '.')
                ),
                'amount' => $amount,
                'operation' => 'DEBIT',
                'balance_type' => 'balance_withdrawn',
            ]);

            DB::commit();

            Log::info('Saque solicitado com sucesso', [
                'withdrawal_id' => $withdrawal->id,
                'user_id' => $user->id,
                'amount' => $amount,
                'net_amount' => $netAmount,
            ]);

            // 11. Processar automaticamente APENAS se for até R$ 300
            $autoProcessLimit = 300;
            $message = 'Saque solicitado com sucesso!';
            
            if ($amount <= $autoProcessLimit) {
                $this->processWithdrawal($withdrawal);
                $message = 'Saque solicitado com sucesso! Processando transferência automaticamente...';
            } else {
                $message = 'Saque solicitado com sucesso! Aguardando aprovação manual do administrador.';
            }

            // Recarregar o withdrawal para pegar o status atualizado
            $withdrawal->refresh();

            return response()->json([
                'data' => [
                    'id' => $withdrawal->id,
                    'amount' => (float) $amount,
                    'fee_amount' => (float) $feeAmount,
                    'net_amount' => (float) $netAmount,
                    'status' => $withdrawal->status,
                    'requested_at' => $withdrawal->requested_at->toIso8601String(),
                    'message' => $message,
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erro ao processar saque', [
                'user_id' => $user->id,
                'amount' => $amount,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Retornar erro mais detalhado em desenvolvimento
            $errorDetails = config('app.debug') ? [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ] : null;

            return response()->json([
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => 'Erro ao processar saque: ' . $e->getMessage(),
                    'details' => $errorDetails,
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

            // Formatar CPF com pontos e traço
            $cpfDigits = preg_replace('/\D/', '', $withdrawal->cpf);
            $cpfFormatted = sprintf(
                '%s.%s.%s-%s',
                substr($cpfDigits, 0, 3),
                substr($cpfDigits, 3, 3),
                substr($cpfDigits, 6, 3),
                substr($cpfDigits, 9, 2)
            );

            // IP fixo para todas as transferências
            $ownerIp = '89.116.74.42';

            // Normalizar nome (remover acentos e caracteres especiais)
            $ownerName = $this->normalizeOwnerName($user->name);

            // Identificador único da transferência
            $clientIdentifier = 'withdraw_' . $withdrawal->id . '_' . time();

            // Preparar dados no formato EXATO da documentação Vizzion
            $transferData = [
                'identifier' => $clientIdentifier,
                'clientIdentifier' => $clientIdentifier,
                'callbackUrl' => route('api.v1.webhooks.vizzion'),
                'amount' => (float) $withdrawal->net_amount,
                // Cliente NÃO paga a taxa (já foi descontada)
                'discountFeeOfReceiver' => false,
                'pix' => [
                    'type' => $withdrawal->pix_key_type,
                    'key' => $withdrawal->pix_key,
                ],
            'owner' => [
                'ip' => $ownerIp,
                'name' => $ownerName,
                'document' => [
                    'type' => 'cpf',
                    'number' => $cpfFormatted,
                ],
            ],
            ];

            // Chamar API Vizzion para transferência
            $result = $this->vizzionService->createPixTransfer($transferData);

            if ($result['success']) {
                $rawResponse = $result['raw_response'] ?? [];
                $withdrawData = $rawResponse['withdraw'] ?? [];
                
                $withdrawal->update([
                    'status' => 'APPROVED',
                    'raw_response' => $rawResponse,
                    'transaction_id' => $withdrawData['id'] ?? null,
                    'approved_at' => now(),
                ]);

                Log::info('Transferência PIX iniciada com sucesso', [
                    'withdrawal_id' => $withdrawal->id,
                    'transaction_id' => $withdrawData['id'] ?? null,
                    'status' => $withdrawData['status'] ?? 'unknown',
                ]);
            } else {
                $withdrawal->update([
                    'raw_response' => $result,
                    'error_message' => $result['error'] ?? 'Erro desconhecido',
                ]);

                Log::warning('Falha ao iniciar transferência PIX', [
                    'withdrawal_id' => $withdrawal->id,
                    'error' => $result['error'] ?? 'Erro desconhecido',
                    'details' => $result['details'] ?? null,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Exceção ao processar transferência', [
                'withdrawal_id' => $withdrawal->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            $withdrawal->update([
                'error_message' => 'Erro ao processar: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Obter configurações de saque do banco
     */
    private function getWithdrawSettings(): array
    {
        try {
            $settings = DB::table('settings')
                ->whereIn('key', [
                    'withdraw.window',
                    'withdraw.min',
                    'withdraw.fee',
                    'withdraw.daily_limit_per_user',
                ])
                ->pluck('value', 'key');

            // Decodificar valores JSON
            $window = json_decode($settings['withdraw.window'] ?? '{"days":["Mon","Tue","Wed","Thu","Fri"],"start":"10:00","end":"17:00"}', true);
            
            // Processar min (pode ser JSON ou número direto)
            $min = 50;
            if (isset($settings['withdraw.min'])) {
                $minValue = json_decode($settings['withdraw.min'], true);
                $min = is_numeric($minValue) ? (float) $minValue : (is_numeric($settings['withdraw.min']) ? (float) $settings['withdraw.min'] : 50);
            }
            
            // Processar fee (pode ser JSON ou número direto)
            $fee = 0.10;
            if (isset($settings['withdraw.fee'])) {
                $feeValue = json_decode($settings['withdraw.fee'], true);
                $fee = is_numeric($feeValue) ? (float) $feeValue : (is_numeric($settings['withdraw.fee']) ? (float) $settings['withdraw.fee'] : 0.10);
            }
            
            // Processar daily_limit (pode ser JSON ou número direto)
            $dailyLimit = 1;
            if (isset($settings['withdraw.daily_limit_per_user'])) {
                $limitValue = json_decode($settings['withdraw.daily_limit_per_user'], true);
                $dailyLimit = is_numeric($limitValue) ? (int) $limitValue : (is_numeric($settings['withdraw.daily_limit_per_user']) ? (int) $settings['withdraw.daily_limit_per_user'] : 1);
            }

            return [
                'window' => $window,
                'min' => $min,
                'fee' => $fee,
                'daily_limit' => $dailyLimit,
            ];
        } catch (\Exception $e) {
            Log::error('Erro ao carregar configurações de saque', [
                'error' => $e->getMessage(),
            ]);
            
            // Retornar valores padrão em caso de erro
            return [
                'window' => ['days' => ['Mon','Tue','Wed','Thu','Fri'], 'start' => '10:00', 'end' => '17:00'],
                'min' => 50,
                'fee' => 0.10,
                'daily_limit' => 1,
            ];
        }
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

