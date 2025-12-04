<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Models\Ledger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DepositController extends Controller
{
    /**
     * Listar todos os depósitos (com filtros)
     */
    public function index(Request $request)
    {
        $query = Deposit::with('user:id,name,email');

        // Filtros
        if ($request->has('status') && $request->status !== 'all') {
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
            })->orWhere('transaction_id', 'ilike', "%{$search}%")
              ->orWhere('order_id', 'ilike', "%{$search}%");
        }

        // Ordenação
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        // Validar coluna de ordenação
        $allowedSortBy = ['id', 'amount', 'status', 'created_at', 'paid_at', 'expires_at'];
        if (!in_array($sortBy, $allowedSortBy)) {
            $sortBy = 'created_at';
        }
        
        $query->orderBy($sortBy, $sortOrder);

        $deposits = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $deposits->map(function ($deposit) {
                return [
                    'id' => $deposit->id,
                    'user' => [
                        'id' => $deposit->user->id,
                        'name' => $deposit->user->name,
                        'email' => $deposit->user->email,
                    ],
                    'amount' => (float) $deposit->amount,
                    'status' => $deposit->status,
                    'transaction_id' => $deposit->transaction_id,
                    'order_id' => $deposit->order_id,
                    'created_at' => $deposit->created_at->toIso8601String(),
                    'paid_at' => $deposit->paid_at?->toIso8601String(),
                    'expires_at' => $deposit->expires_at?->toIso8601String(),
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
     * Estatísticas gerais de depósitos
     */
    public function stats()
    {
        $total = Deposit::count();
        $pending = Deposit::where('status', 'PENDING')->count();
        $paid = Deposit::where('status', 'PAID')->count();
        $expired = Deposit::where('status', 'EXPIRED')->count();
        $cancelled = Deposit::where('status', 'CANCELLED')->count();
        
        $totalAmount = (float) Deposit::where('status', 'PAID')->sum('amount');
        $pendingAmount = (float) Deposit::where('status', 'PENDING')->sum('amount');

        return response()->json([
            'data' => [
                'summary' => [
                    'total' => $total,
                    'pending' => $pending,
                    'paid' => $paid,
                    'expired' => $expired,
                    'cancelled' => $cancelled,
                ],
                'amounts' => [
                    'total_paid' => $totalAmount,
                    'pending' => $pendingAmount,
                ],
            ],
        ]);
    }

    /**
     * Ver detalhes de um depósito específico
     */
    public function show($id)
    {
        $deposit = Deposit::with('user:id,name,email,phone,balance,balance_withdrawn')
            ->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $deposit->id,
                'user' => [
                    'id' => $deposit->user->id,
                    'name' => $deposit->user->name,
                    'email' => $deposit->user->email,
                    'phone' => $deposit->user->phone,
                    'balance' => (float) $deposit->user->balance,
                    'balance_withdrawn' => (float) $deposit->user->balance_withdrawn,
                ],
                'amount' => (float) $deposit->amount,
                'status' => $deposit->status,
                'transaction_id' => $deposit->transaction_id,
                'order_id' => $deposit->order_id,
                'qr_code' => $deposit->qr_code,
                'qr_code_image' => $deposit->qr_code_image,
                'order_url' => $deposit->order_url,
                'created_at' => $deposit->created_at->toIso8601String(),
                'paid_at' => $deposit->paid_at?->toIso8601String(),
                'expires_at' => $deposit->expires_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Marcar depósito como PAGO
     */
    public function markAsPaid($id)
    {
        try {
            DB::beginTransaction();

            $deposit = Deposit::with('user')->findOrFail($id);

            // Verificar se já está pago
            if ($deposit->status === 'PAID') {
                return response()->json([
                    'message' => 'Este depósito já está marcado como pago',
                ], 400);
            }

            $oldStatus = $deposit->status;
            $user = $deposit->user;
            $amount = (float) $deposit->amount;

            // Se estava pendente ou cancelado, creditar o saldo
            if (in_array($oldStatus, ['PENDING', 'CANCELLED', 'EXPIRED'])) {
                $balanceBefore = $user->balance;
                
                // Creditar no saldo do usuário
                $user->increment('balance', $amount);
                $user->refresh();
                
                $balanceAfter = $user->balance;

                // Registrar no ledger
                Ledger::create([
                    'user_id' => $user->id,
                    'type' => 'DEPOSIT',
                    'reference_type' => Deposit::class,
                    'reference_id' => $deposit->id,
                    'description' => sprintf(
                        'Depósito #%d aprovado manualmente pelo admin (estava %s)',
                        $deposit->id,
                        $oldStatus
                    ),
                    'amount' => $amount,
                    'operation' => 'CREDIT',
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                ]);
            }

            // Atualizar status do depósito
            $deposit->status = 'PAID';
            $deposit->paid_at = Carbon::now(config('app.timezone'));
            $deposit->save();

            DB::commit();

            Log::info("Admin marcou depósito #{$deposit->id} como PAID (era {$oldStatus})");

            return response()->json([
                'message' => 'Depósito marcado como pago com sucesso',
                'data' => [
                    'id' => $deposit->id,
                    'status' => $deposit->status,
                    'paid_at' => $deposit->paid_at->toIso8601String(),
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erro ao marcar depósito como pago: " . $e->getMessage());

            return response()->json([
                'message' => 'Erro ao marcar depósito como pago',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Marcar depósito como CANCELADO
     */
    public function markAsCancelled($id)
    {
        try {
            DB::beginTransaction();

            $deposit = Deposit::with('user')->findOrFail($id);

            // Verificar se já está cancelado
            if ($deposit->status === 'CANCELLED') {
                return response()->json([
                    'message' => 'Este depósito já está marcado como cancelado',
                ], 400);
            }

            $oldStatus = $deposit->status;
            $user = $deposit->user;
            $amount = (float) $deposit->amount;

            // Se estava PAGO, precisa estornar o saldo
            if ($oldStatus === 'PAID') {
                $balanceBefore = $user->balance;
                
                // Verificar se o usuário tem saldo suficiente para estornar
                if ($user->balance < $amount) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Usuário não tem saldo suficiente para estornar este depósito',
                        'data' => [
                            'required' => $amount,
                            'available' => (float) $user->balance,
                        ]
                    ], 400);
                }

                // Estornar o saldo
                $user->decrement('balance', $amount);
                $user->refresh();
                
                $balanceAfter = $user->balance;

                // Registrar no ledger
                Ledger::create([
                    'user_id' => $user->id,
                    'type' => 'DEPOSIT',
                    'reference_type' => Deposit::class,
                    'reference_id' => $deposit->id,
                    'description' => sprintf(
                        'Estorno de depósito #%d cancelado pelo admin',
                        $deposit->id
                    ),
                    'amount' => $amount,
                    'operation' => 'DEBIT',
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                ]);
            }

            // Atualizar status do depósito
            $deposit->status = 'CANCELLED';
            $deposit->save();

            DB::commit();

            Log::warning("Admin cancelou depósito #{$deposit->id} (era {$oldStatus})");

            return response()->json([
                'message' => 'Depósito marcado como cancelado com sucesso',
                'data' => [
                    'id' => $deposit->id,
                    'status' => $deposit->status,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erro ao cancelar depósito: " . $e->getMessage());

            return response()->json([
                'message' => 'Erro ao cancelar depósito',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Marcar depósito como PENDENTE
     */
    public function markAsPending($id)
    {
        try {
            DB::beginTransaction();

            $deposit = Deposit::with('user')->findOrFail($id);

            // Verificar se já está pendente
            if ($deposit->status === 'PENDING') {
                return response()->json([
                    'message' => 'Este depósito já está marcado como pendente',
                ], 400);
            }

            $oldStatus = $deposit->status;
            $user = $deposit->user;
            $amount = (float) $deposit->amount;

            // Se estava PAGO, precisa estornar o saldo
            if ($oldStatus === 'PAID') {
                $balanceBefore = $user->balance;
                
                // Verificar se o usuário tem saldo suficiente para estornar
                if ($user->balance < $amount) {
                    DB::rollBack();
                    return response()->json([
                        'message' => 'Usuário não tem saldo suficiente para estornar este depósito',
                        'data' => [
                            'required' => $amount,
                            'available' => (float) $user->balance,
                        ]
                    ], 400);
                }

                // Estornar o saldo
                $user->decrement('balance', $amount);
                $user->refresh();
                
                $balanceAfter = $user->balance;

                // Registrar no ledger
                Ledger::create([
                    'user_id' => $user->id,
                    'type' => 'DEPOSIT',
                    'reference_type' => Deposit::class,
                    'reference_id' => $deposit->id,
                    'description' => sprintf(
                        'Estorno de depósito #%d alterado para pendente pelo admin',
                        $deposit->id
                    ),
                    'amount' => $amount,
                    'operation' => 'DEBIT',
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                ]);
            }

            // Atualizar status do depósito
            $deposit->status = 'PENDING';
            $deposit->paid_at = null;
            $deposit->save();

            DB::commit();

            Log::info("Admin alterou depósito #{$deposit->id} para PENDING (era {$oldStatus})");

            return response()->json([
                'message' => 'Depósito marcado como pendente com sucesso',
                'data' => [
                    'id' => $deposit->id,
                    'status' => $deposit->status,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erro ao marcar depósito como pendente: " . $e->getMessage());

            return response()->json([
                'message' => 'Erro ao marcar depósito como pendente',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

