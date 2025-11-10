<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Services\VizzionPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class DepositController extends Controller
{
    protected VizzionPayService $vizzionService;

    public function __construct(VizzionPayService $vizzionService)
    {
        $this->vizzionService = $vizzionService;
    }

    /**
     * Criar um novo depósito via PIX
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:50',
            'cpf' => 'required|string|regex:/^\d{11}$/',
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

        try {
            DB::beginTransaction();

            // Atualizar CPF do usuário se não tiver
            if (!$user->cpf) {
                $user->update(['cpf' => $request->cpf]);
            }

            // Criar registro de depósito
            $deposit = Deposit::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'status' => 'PENDING',
                'expires_at' => now()->addMinutes(30),
            ]);

            // Gerar identificador único
            $identifier = 'ECO-' . strtoupper(\Illuminate\Support\Str::random(10));

            // Telefone SEMPRE aleatório válido (garante geração do PIX pela Vizzion)
            // Formato: (11) 9XXXX-XXXX com números aleatórios
            // Não usa telefone real do usuário para evitar problemas na API
            $phoneClean = '11' . str_pad((string)$user->id, 9, random_int(1000, 9999), STR_PAD_LEFT);
            $phoneClean = substr($phoneClean, 0, 11); // Garantir exatos 11 dígitos
            $phonePretty = $this->formatPhone($phoneClean);

            // CPF formatado
            $documentRaw = preg_replace('/\D/', '', $request->cpf);
            $documentPretty = $this->formatCPF($documentRaw);

            // Email válido
            $email = filter_var($user->email, FILTER_VALIDATE_EMAIL) 
                ? $user->email 
                : 'user' . $user->id . '@ecovacs.pro';

            // Preparar dados para a API Vizzion
            $pixData = [
                'identifier' => $identifier,
                'clientIdentifier' => $identifier,
                'amount' => $amount,
                'shippingFee' => 0,
                'extraFee' => 0,
                'discount' => 0,
                'client' => [
                    'name' => $user->name,
                    'email' => $email,
                    'phone' => $phonePretty,
                    'documentType' => 'CPF',
                    'document' => $documentRaw,
                ],
                'products' => [
                    [
                        'id' => 'deposit-' . time(),
                        'name' => 'Depósito Ecovacs',
                        'quantity' => 1,
                        'price' => $amount,
                    ],
                ],
                'dueDate' => now()->addDay()->toDateString(),
                'discountFeeOfReceiver' => false,
                'pix' => [
                    'type' => 'email',
                    'key' => $email,
                ],
                'owner' => [
                    'ip' => $request->ip(),
                    'name' => $user->name,
                    'document' => [
                        'type' => 'cpf',
                        'number' => $documentRaw,
                    ],
                ],
                'metadata' => [
                    'user_id' => $user->id,
                    'platform' => 'Ecovacs',
                ],
                'callbackUrl' => route('api.v1.webhooks.vizzion'),
            ];

            $result = $this->vizzionService->createPixCharge($pixData);

            if (!$result['success']) {
                DB::rollBack();
                
                Log::error('Erro ao criar cobrança PIX', [
                    'user_id' => $user->id,
                    'amount' => $amount,
                    'error' => $result['error'] ?? 'Erro desconhecido',
                    'sent_data' => $pixData,
                ]);

                return response()->json([
                    'error' => [
                        'code' => 'PIX_GENERATION_ERROR',
                        'message' => $result['error'] ?? 'Erro ao gerar cobrança PIX',
                        'details' => $result['details'] ?? null,
                    ],
                    'sent' => [
                        'document' => $documentRaw,
                        'document_pretty' => $documentPretty,
                        'phone' => $phonePretty,
                        'email' => $email,
                    ],
                ], 400);
            }

            // Atualizar depósito com dados do PIX
            $deposit->update([
                'transaction_id' => $result['transaction_id'],
                'order_id' => $result['order_id'],
                'qr_code' => $result['qr_code'],
                'qr_code_base64' => $result['qr_code_base64'],
                'qr_code_image' => $result['qr_code_image'],
                'order_url' => $result['order_url'],
                'raw_response' => $result['raw_response'],
            ]);

            DB::commit();

            return response()->json([
                'data' => [
                    'deposit_id' => $deposit->id,
                    'transactionId' => $result['transaction_id'],
                    'status' => $result['status'],
                    'qrCode' => $result['qr_code_base64'] ?? $result['qr_code_image'],
                    'copia_cola' => $result['qr_code'],
                    'provider_ref' => $result['transaction_id'],
                    'amount' => (float) $deposit->amount,
                    'order' => [
                        'id' => $result['order_id'],
                        'url' => $result['order_url'],
                    ],
                    'pix' => [
                        'code' => $result['qr_code'],
                        'base64' => $result['qr_code_base64'],
                        'image' => $result['qr_code_image'],
                    ],
                    'expires_at' => $deposit->expires_at?->toIso8601String(),
                    'created_at' => $deposit->created_at->toIso8601String(),
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Exceção ao criar depósito', [
                'user_id' => $user->id,
                'amount' => $amount,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => 'Erro ao processar depósito',
                ]
            ], 500);
        }
    }

    /**
     * Listar depósitos do usuário
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $deposits = Deposit::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $deposits->map(function ($deposit) {
                return [
                    'id' => $deposit->id,
                    'amount' => (float) $deposit->amount,
                    'status' => $deposit->status,
                    'transaction_id' => $deposit->transaction_id,
                    'paid_at' => $deposit->paid_at?->toIso8601String(),
                    'created_at' => $deposit->created_at->toIso8601String(),
                ];
            }),
            'meta' => [
                'current_page' => $deposits->currentPage(),
                'last_page' => $deposits->lastPage(),
                'per_page' => $deposits->perPage(),
                'total' => $deposits->total(),
            ]
        ]);
    }

    /**
     * Buscar depósito específico
     */
    public function show(Request $request, int $id)
    {
        $user = $request->user();
        
        $deposit = Deposit::where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $deposit->id,
                'amount' => (float) $deposit->amount,
                'status' => $deposit->status,
                'transaction_id' => $deposit->transaction_id,
                'qr_code' => $deposit->qr_code,
                'qr_code_base64' => $deposit->qr_code_base64,
                'qr_code_image' => $deposit->qr_code_image,
                'order_url' => $deposit->order_url,
                'paid_at' => $deposit->paid_at?->toIso8601String(),
                'expires_at' => $deposit->expires_at?->toIso8601String(),
                'created_at' => $deposit->created_at->toIso8601String(),
            ]
        ]);
    }

    /**
     * Verificar status de um depósito manualmente
     */
    public function checkStatus(Request $request, int $id)
    {
        $user = $request->user();
        
        $deposit = Deposit::where('user_id', $user->id)
            ->findOrFail($id);

        if ($deposit->status === 'PAID') {
            return response()->json([
                'data' => [
                    'status' => 'PAID',
                    'message' => 'Depósito já foi confirmado',
                ]
            ]);
        }

        if (!$deposit->transaction_id) {
            return response()->json([
                'error' => [
                    'code' => 'NO_TRANSACTION_ID',
                    'message' => 'Depósito sem transaction_id',
                ]
            ], 400);
        }

        // Buscar status na API Vizzion
        $result = $this->vizzionService->getTransaction($deposit->transaction_id);

        if (!$result['success']) {
            return response()->json([
                'error' => [
                    'code' => 'API_ERROR',
                    'message' => 'Erro ao verificar status',
                ]
            ], 500);
        }

        $apiStatus = $result['data']['status'] ?? null;

        if (in_array(strtoupper($apiStatus), ['PAID', 'APPROVED', 'CONFIRMED'])) {
            DB::beginTransaction();
            
            $deposit->markAsPaid();
            
            DB::commit();

            return response()->json([
                'data' => [
                    'status' => 'PAID',
                    'message' => 'Pagamento confirmado!',
                ]
            ]);
        }

        return response()->json([
            'data' => [
                'status' => $deposit->status,
                'message' => 'Pagamento ainda não confirmado',
            ]
        ]);
    }

    /**
     * Formatar telefone no padrão brasileiro
     */
    private function formatPhone(string $phone): string
    {
        $clean = preg_replace('/\D/', '', $phone);
        
        if (strlen($clean) === 11) {
            return sprintf('(%s) %s-%s', 
                substr($clean, 0, 2),
                substr($clean, 2, 5),
                substr($clean, 7, 4)
            );
        }
        
        if (strlen($clean) === 10) {
            return sprintf('(%s) %s-%s', 
                substr($clean, 0, 2),
                substr($clean, 2, 4),
                substr($clean, 6, 4)
            );
        }
        
        return $phone;
    }

    /**
     * Formatar CPF no padrão brasileiro
     */
    private function formatCPF(string $cpf): string
    {
        $clean = preg_replace('/\D/', '', $cpf);
        
        if (strlen($clean) === 11) {
            return sprintf('%s.%s.%s-%s',
                substr($clean, 0, 3),
                substr($clean, 3, 3),
                substr($clean, 6, 3),
                substr($clean, 9, 2)
            );
        }
        
        return $cpf;
    }
}
