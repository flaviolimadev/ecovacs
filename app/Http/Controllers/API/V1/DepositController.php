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
            'amount' => 'required|numeric|min:1',
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

        // Validar valor mínimo de depósito (configurável)
        $minDeposit = config('mmn.deposit.min', 50);
        if ($amount < $minDeposit) {
            return response()->json([
                'error' => [
                    'code' => 'MIN_DEPOSIT_ERROR',
                    'message' => "Valor mínimo de depósito é R$ {$minDeposit}",
                ]
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Criar registro de depósito
            $deposit = Deposit::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'status' => 'PENDING',
                'expires_at' => now()->addMinutes(30), // PIX expira em 30 minutos
            ]);

            // Gerar cobrança PIX via Vizzion
            $pixData = [
                'amount' => $amount,
                'description' => "Depósito Ecovacs - {$user->name}",
                'customer' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'document' => $user->cpf ?? '',
                ],
                'externalReference' => "DEP-{$deposit->id}",
                'callbackUrl' => route('api.v1.deposits.webhook'),
            ];

            $result = $this->vizzionService->createPixCharge($pixData);

            if (!$result['success']) {
                DB::rollBack();
                
                Log::error('Erro ao criar cobrança PIX', [
                    'user_id' => $user->id,
                    'amount' => $amount,
                    'error' => $result['error'] ?? 'Erro desconhecido',
                ]);

                return response()->json([
                    'error' => [
                        'code' => 'PIX_GENERATION_ERROR',
                        'message' => $result['error'] ?? 'Erro ao gerar cobrança PIX',
                        'details' => $result['details'] ?? null,
                    ]
                ], 500);
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
                    'id' => $deposit->id,
                    'amount' => (float) $deposit->amount,
                    'status' => $deposit->status,
                    'transaction_id' => $deposit->transaction_id,
                    'qr_code' => $deposit->qr_code,
                    'qr_code_base64' => $deposit->qr_code_base64,
                    'qr_code_image' => $deposit->qr_code_image,
                    'order_url' => $deposit->order_url,
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
     * Webhook para receber notificações de pagamento
     */
    public function webhook(Request $request)
    {
        Log::info('Webhook Vizzion recebido', $request->all());

        try {
            $transactionId = $request->input('transactionId') ?? $request->input('transaction_id');
            $status = $request->input('status');
            $externalReference = $request->input('externalReference') ?? $request->input('external_reference');

            if (!$transactionId && !$externalReference) {
                Log::warning('Webhook sem transaction_id ou externalReference', $request->all());
                return response()->json(['message' => 'OK'], 200);
            }

            // Buscar depósito por transaction_id ou externalReference
            $deposit = null;
            
            if ($transactionId) {
                $deposit = Deposit::where('transaction_id', $transactionId)->first();
            }
            
            if (!$deposit && $externalReference) {
                // Extrair ID do externalReference (formato: DEP-123)
                if (preg_match('/DEP-(\d+)/', $externalReference, $matches)) {
                    $deposit = Deposit::find($matches[1]);
                }
            }

            if (!$deposit) {
                Log::warning('Depósito não encontrado no webhook', [
                    'transaction_id' => $transactionId,
                    'external_reference' => $externalReference,
                ]);
                return response()->json(['message' => 'OK'], 200);
            }

            // Se já foi pago, ignorar
            if ($deposit->status === 'PAID') {
                return response()->json(['message' => 'OK'], 200);
            }

            // Atualizar status baseado no retorno
            if (in_array(strtoupper($status), ['PAID', 'APPROVED', 'CONFIRMED'])) {
                DB::beginTransaction();
                
                $deposit->markAsPaid();
                
                DB::commit();

                Log::info('Depósito confirmado via webhook', [
                    'deposit_id' => $deposit->id,
                    'user_id' => $deposit->user_id,
                    'amount' => $deposit->amount,
                ]);
            }

            return response()->json(['message' => 'OK'], 200);

        } catch (\Exception $e) {
            Log::error('Erro ao processar webhook Vizzion', [
                'error' => $e->getMessage(),
                'payload' => $request->all(),
            ]);

            return response()->json(['message' => 'OK'], 200);
        }
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
}
