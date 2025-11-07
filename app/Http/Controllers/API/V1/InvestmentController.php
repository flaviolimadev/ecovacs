<?php

namespace App\Http\Controllers\API\V1;

use App\Actions\ProcessReferralCommissions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Investment\CreateInvestmentRequest;
use App\Models\Plan;
use App\Models\Cycle;
use App\Models\Ledger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class InvestmentController extends Controller
{
    /**
     * Create a new investment (purchase a plan)
     */
    public function store(CreateInvestmentRequest $request)
    {
        try {
            DB::beginTransaction();

            $user = $request->user();
            $planId = $request->plan_id;

            // 1. Buscar o plano
            $plan = Plan::active()->find($planId);

            if (!$plan) {
                return response()->json([
                    'message' => 'Plano não encontrado ou inativo',
                ], 404);
            }

            // 2. Verificar se o usuário tem saldo suficiente
            $price = (float) $plan->price;
            $userBalance = (float) $user->balance;

            if ($userBalance < $price) {
                return response()->json([
                    'message' => 'Saldo insuficiente',
                    'error' => 'INSUFFICIENT_BALANCE',
                    'data' => [
                        'required' => $price,
                        'available' => $userBalance,
                        'missing' => $price - $userBalance,
                        'redirect' => '/deposit', // Redirecionar para depósito
                    ],
                ], 422);
            }

            // 3. Verificar limite de compras simultâneas do plano
            if ($plan->max_purchases > 0) {
                $activeCyclesCount = Cycle::where('user_id', $user->id)
                    ->where('plan_id', $plan->id)
                    ->where('status', 'ACTIVE')
                    ->count();

                if ($activeCyclesCount >= $plan->max_purchases) {
                    return response()->json([
                        'message' => 'Você atingiu o limite de compras simultâneas para este plano',
                        'error' => 'PURCHASE_LIMIT_REACHED',
                        'data' => [
                            'max_purchases' => $plan->max_purchases,
                            'current_active' => $activeCyclesCount,
                        ],
                    ], 422);
                }
            }

            // 4. Verificar se é a primeira compra do usuário
            $isFirstPurchase = Cycle::where('user_id', $user->id)->count() === 0;

            // 5. Calcular datas e valores
            $now = Carbon::now();
            $startedAt = $now;
            $endsAt = $now->copy()->addDays($plan->duration_days);

            // 6. Criar o ciclo/investimento
            $cycle = Cycle::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'amount' => $price,
                'type' => $plan->type,
                'duration_days' => $plan->duration_days,
                'started_at' => $startedAt,
                'ends_at' => $endsAt,
                'status' => 'ACTIVE',
                'is_first_purchase' => $isFirstPurchase,
                'daily_income' => $plan->daily_income,
                'total_return' => $plan->total_return,
                'total_paid' => 0,
                'days_paid' => 0,
            ]);

            // 7. Deduzir valor do balance do usuário
            $balanceBefore = $userBalance;
            $user->balance = $userBalance - $price;
            $user->total_invested = (float) $user->total_invested + $price;
            $user->save();

            // 7.1. Registrar no extrato (Ledger)
            Ledger::create([
                'user_id' => $user->id,
                'type' => 'INVESTMENT',
                'reference_type' => Cycle::class,
                'reference_id' => $cycle->id,
                'description' => "Investimento no plano: {$plan->name}",
                'amount' => $price,
                'operation' => 'DEBIT',
                'balance_before' => $balanceBefore,
                'balance_after' => $user->balance,
            ]);

            // 8. Refresh para pegar dados atualizados
            $cycle->load('plan');
            $user->refresh();

            DB::commit();

            // 9. Processar comissões de referência (após commit)
            $commissionsData = null;
            try {
                $commissionsProcessor = new ProcessReferralCommissions();
                $commissionsData = $commissionsProcessor->execute($cycle);
                
                Log::info('Comissões processadas com sucesso', [
                    'cycle_id' => $cycle->id,
                    'commissions_count' => count($commissionsData['commissions']),
                    'total_distributed' => $commissionsData['total_distributed'],
                ]);
            } catch (\Exception $e) {
                // Log do erro, mas não falha a compra
                Log::error('Erro ao processar comissões', [
                    'cycle_id' => $cycle->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            return response()->json([
                'message' => 'Plano contratado com sucesso!',
                'data' => [
                    'cycle' => [
                        'id' => $cycle->id,
                        'plan_name' => $plan->name,
                        'amount' => (float) $cycle->amount,
                        'type' => $cycle->type,
                        'duration_days' => $cycle->duration_days,
                        'daily_income' => $cycle->daily_income ? (float) $cycle->daily_income : null,
                        'total_return' => (float) $cycle->total_return,
                        'started_at' => $cycle->started_at,
                        'ends_at' => $cycle->ends_at,
                        'status' => $cycle->status,
                        'progress' => 0,
                    ],
                    'user_balance' => [
                        'balance' => (float) $user->balance,
                        'balance_withdrawn' => (float) $user->balance_withdrawn,
                        'total_invested' => (float) $user->total_invested,
                    ],
                    'commissions' => $commissionsData ? [
                        'distributed' => true,
                        'total_amount' => $commissionsData['total_distributed'],
                        'count' => count($commissionsData['commissions']),
                    ] : null,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Erro ao contratar plano',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user's investments
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $status = $request->query('status'); // active, finished, all

            Log::info('Buscando investimentos', [
                'user_id' => $user->id,
                'status_filter' => $status,
            ]);

            $query = Cycle::where('user_id', $user->id)
                ->with('plan')
                ->orderBy('created_at', 'desc');

            if ($status === 'active') {
                $query->where('status', 'ACTIVE');
            } elseif ($status === 'finished') {
                $query->where('status', 'FINISHED');
            }

            $cycles = $query->get();
            
            Log::info('Investimentos encontrados', [
                'user_id' => $user->id,
                'total' => $cycles->count(),
                'cycles_ids' => $cycles->pluck('id')->toArray(),
            ]);

            $cycles = $cycles->map(function ($cycle) {
                return [
                    'id' => $cycle->id,
                    'plan_id' => $cycle->plan_id,
                    'plan_name' => $cycle->plan->name ?? 'N/A',
                    'plan_image' => $cycle->plan->image ?? '',
                    'amount' => (float) ($cycle->amount ?? 0),
                    'type' => $cycle->type,
                    'duration_days' => $cycle->duration_days,
                    'daily_income' => $cycle->daily_income ? (float) $cycle->daily_income : null,
                    'total_return' => (float) ($cycle->total_return ?? 0),
                    'total_paid' => (float) ($cycle->total_paid ?? 0),
                    'days_paid' => $cycle->days_paid ?? 0,
                    'started_at' => $cycle->started_at,
                    'ends_at' => $cycle->ends_at,
                    'last_payment_at' => $cycle->last_payment_at,
                    'status' => $cycle->status,
                    'progress' => $cycle->getProgressPercentage(),
                    'is_first_purchase' => $cycle->is_first_purchase,
                ];
            });

            return response()->json([
                'message' => 'Investimentos carregados com sucesso',
                'data' => $cycles,
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro ao buscar investimentos', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erro ao carregar investimentos',
                'data' => [],
            ], 200); // Retornar 200 com array vazio para não quebrar o frontend
        }
    }

    /**
     * Get single investment details
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        $cycle = Cycle::with('plan')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$cycle) {
            return response()->json([
                'message' => 'Investimento não encontrado',
            ], 404);
        }

        return response()->json([
            'message' => 'Investimento encontrado',
            'data' => [
                'id' => $cycle->id,
                'plan_id' => $cycle->plan_id,
                'plan_name' => $cycle->plan->name,
                'plan_image' => $cycle->plan->image,
                'amount' => (float) $cycle->amount,
                'type' => $cycle->type,
                'duration_days' => $cycle->duration_days,
                'daily_income' => $cycle->daily_income ? (float) $cycle->daily_income : null,
                'total_return' => (float) $cycle->total_return,
                'total_paid' => (float) $cycle->total_paid,
                'days_paid' => $cycle->days_paid,
                'started_at' => $cycle->started_at,
                'ends_at' => $cycle->ends_at,
                'last_payment_at' => $cycle->last_payment_at,
                'status' => $cycle->status,
                'progress' => $cycle->getProgressPercentage(),
                'is_first_purchase' => $cycle->is_first_purchase,
            ],
        ]);
    }

    /**
     * Get user's investment statistics
     */
    public function stats(Request $request)
    {
        try {
            $user = $request->user();

            $activeCycles = Cycle::where('user_id', $user->id)
                ->where('status', 'ACTIVE')
                ->count();

            $totalInvested = Cycle::where('user_id', $user->id)
                ->sum('amount');

            $totalEarned = Cycle::where('user_id', $user->id)
                ->sum('total_paid');

            $finishedCycles = Cycle::where('user_id', $user->id)
                ->where('status', 'FINISHED')
                ->count();

            // Verificar se usuário está ativo (tem pelo menos 1 investimento)
            $hasInvestments = Cycle::where('user_id', $user->id)->exists();
            $userStatus = $hasInvestments ? 'active' : 'inactive';

            return response()->json([
                'message' => 'Estatísticas carregadas',
                'data' => [
                    'user_status' => $userStatus,
                    'is_active' => $hasInvestments,
                    'active_cycles' => $activeCycles,
                    'finished_cycles' => $finishedCycles,
                    'total_invested' => (float) ($totalInvested ?? 0),
                    'total_earned' => (float) ($totalEarned ?? 0),
                    'user_balance' => (float) ($user->balance ?? 0),
                    'user_balance_withdrawn' => (float) ($user->balance_withdrawn ?? 0),
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Erro ao buscar estatísticas de investimento', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erro ao carregar estatísticas',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
