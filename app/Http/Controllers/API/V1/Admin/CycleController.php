<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cycle;
use App\Models\User;
use App\Models\Plan;
use App\Models\Ledger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CycleController extends Controller
{
    /**
     * Listar todos os ciclos com filtros
     */
    public function index(Request $request)
    {
        $query = Cycle::with(['user:id,name,email', 'plan:id,name,image'])
            ->orderBy('created_at', 'desc');

        // Filtro por usuário
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filtro por plano
        if ($request->filled('plan_id')) {
            $query->where('plan_id', $request->plan_id);
        }

        // Filtro por status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filtro por tipo
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Busca por nome de usuário ou email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $cycles = $query->paginate($perPage);

        // Adicionar informações calculadas
        $cycles->getCollection()->transform(function ($cycle) {
            return [
                'id' => $cycle->id,
                'user' => [
                    'id' => $cycle->user->id,
                    'name' => $cycle->user->name,
                    'email' => $cycle->user->email,
                ],
                'plan' => [
                    'id' => $cycle->plan->id,
                    'name' => $cycle->plan->name,
                    'image' => $cycle->plan->image,
                ],
                'amount' => (float) $cycle->amount,
                'type' => $cycle->type,
                'status' => $cycle->status,
                'duration_days' => $cycle->duration_days,
                'days_paid' => $cycle->days_paid,
                'daily_income' => (float) $cycle->daily_income,
                'total_return' => (float) $cycle->total_return,
                'total_paid' => (float) $cycle->total_paid,
                'started_at' => $cycle->started_at,
                'ends_at' => $cycle->ends_at,
                'created_at' => $cycle->created_at,
                'progress_percent' => $cycle->duration_days > 0 
                    ? round(($cycle->days_paid / $cycle->duration_days) * 100, 2) 
                    : 0,
                'remaining_days' => max(0, $cycle->duration_days - $cycle->days_paid),
                'remaining_payment' => max(0, (float) $cycle->total_return - (float) $cycle->total_paid),
            ];
        });

        return response()->json([
            'data' => $cycles->items(),
            'meta' => [
                'current_page' => $cycles->currentPage(),
                'last_page' => $cycles->lastPage(),
                'per_page' => $cycles->perPage(),
                'total' => $cycles->total(),
            ]
        ]);
    }

    /**
     * Estatísticas de ciclos
     */
    public function stats()
    {
        $totalCycles = Cycle::count();
        $activeCycles = Cycle::where('status', 'ACTIVE')->count();
        $finishedCycles = Cycle::where('status', 'FINISHED')->count();
        $cancelledCycles = Cycle::where('status', 'CANCELLED')->count();

        $totalInvested = Cycle::sum('amount');
        $totalReturn = Cycle::sum('total_return');
        $totalPaid = Cycle::sum('total_paid');

        return response()->json([
            'data' => [
                'total' => $totalCycles,
                'active' => $activeCycles,
                'finished' => $finishedCycles,
                'cancelled' => $cancelledCycles,
                'financial' => [
                    'total_invested' => (float) $totalInvested,
                    'total_return' => (float) $totalReturn,
                    'total_paid' => (float) $totalPaid,
                    'pending_return' => (float) ($totalReturn - $totalPaid),
                ],
            ]
        ]);
    }

    /**
     * Detalhes de um ciclo específico
     */
    public function show($id)
    {
        $cycle = Cycle::with(['user', 'plan'])->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $cycle->id,
                'user' => [
                    'id' => $cycle->user->id,
                    'name' => $cycle->user->name,
                    'email' => $cycle->user->email,
                ],
                'plan' => [
                    'id' => $cycle->plan->id,
                    'name' => $cycle->plan->name,
                    'image' => $cycle->plan->image,
                ],
                'amount' => (float) $cycle->amount,
                'type' => $cycle->type,
                'status' => $cycle->status,
                'duration_days' => $cycle->duration_days,
                'days_paid' => $cycle->days_paid,
                'daily_income' => (float) $cycle->daily_income,
                'total_return' => (float) $cycle->total_return,
                'total_paid' => (float) $cycle->total_paid,
                'is_first_purchase' => $cycle->is_first_purchase,
                'started_at' => $cycle->started_at,
                'ends_at' => $cycle->ends_at,
                'created_at' => $cycle->created_at,
                'updated_at' => $cycle->updated_at,
            ]
        ]);
    }

    /**
     * Ativar um ciclo (mudar status para ACTIVE)
     */
    public function activate($id)
    {
        try {
            DB::beginTransaction();

            $cycle = Cycle::findOrFail($id);

            if ($cycle->status === 'ACTIVE') {
                return response()->json([
                    'message' => 'Este ciclo já está ativo',
                ], 400);
            }

            $cycle->status = 'ACTIVE';
            $cycle->save();

            // Registrar no ledger
            Ledger::create([
                'user_id' => $cycle->user_id,
                'type' => 'EARNING',
                'reference_type' => Cycle::class,
                'reference_id' => $cycle->id,
                'description' => sprintf('Ciclo #%d reativado pelo administrador', $cycle->id),
                'amount' => 0,
                'operation' => 'CREDIT',
                'balance_before' => $cycle->user->balance_withdrawn,
                'balance_after' => $cycle->user->balance_withdrawn,
            ]);

            DB::commit();

            Log::info("Admin ativou ciclo #{$cycle->id}");

            return response()->json([
                'message' => 'Ciclo ativado com sucesso',
                'data' => [
                    'id' => $cycle->id,
                    'status' => $cycle->status,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erro ao ativar ciclo: " . $e->getMessage());

            return response()->json([
                'message' => 'Erro ao ativar ciclo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancelar um ciclo (mudar status para CANCELLED)
     */
    public function cancel($id)
    {
        try {
            DB::beginTransaction();

            $cycle = Cycle::findOrFail($id);

            if ($cycle->status === 'CANCELLED') {
                return response()->json([
                    'message' => 'Este ciclo já está cancelado',
                ], 400);
            }

            $oldStatus = $cycle->status;
            $cycle->status = 'CANCELLED';
            $cycle->save();

            // Registrar no ledger
            Ledger::create([
                'user_id' => $cycle->user_id,
                'type' => 'EARNING',
                'reference_type' => Cycle::class,
                'reference_id' => $cycle->id,
                'description' => sprintf('Ciclo #%d cancelado pelo administrador (estava %s)', $cycle->id, $oldStatus),
                'amount' => 0,
                'operation' => 'CREDIT',
                'balance_before' => $cycle->user->balance_withdrawn,
                'balance_after' => $cycle->user->balance_withdrawn,
            ]);

            DB::commit();

            Log::info("Admin cancelou ciclo #{$cycle->id}");

            return response()->json([
                'message' => 'Ciclo cancelado com sucesso',
                'data' => [
                    'id' => $cycle->id,
                    'status' => $cycle->status,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erro ao cancelar ciclo: " . $e->getMessage());

            return response()->json([
                'message' => 'Erro ao cancelar ciclo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Deletar um ciclo (remove completamente do banco)
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $cycle = Cycle::findOrFail($id);
            $userId = $cycle->user_id;
            $cycleId = $cycle->id;
            $amount = $cycle->amount;

            // Opcional: devolver o valor investido ao usuário
            // Descomente as linhas abaixo se quiser devolver o valor ao deletar
            // $user = $cycle->user;
            // $user->increment('balance', $amount);

            // Deletar registros relacionados no ledger (opcional)
            Ledger::where('reference_type', Cycle::class)
                ->where('reference_id', $cycle->id)
                ->delete();

            // Deletar o ciclo
            $cycle->delete();

            DB::commit();

            Log::warning("Admin deletou ciclo #{$cycleId} (usuário #{$userId}, valor R$ {$amount})");

            return response()->json([
                'message' => 'Ciclo deletado com sucesso',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erro ao deletar ciclo: " . $e->getMessage());

            return response()->json([
                'message' => 'Erro ao deletar ciclo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Listar usuários para filtro (dropdown)
     */
    public function usersList()
    {
        $users = User::select('id', 'name', 'email')
            ->whereHas('cycles')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $users
        ]);
    }

    /**
     * Listar planos para filtro (dropdown)
     */
    public function plansList()
    {
        $plans = Plan::select('id', 'name', 'image')
            ->whereHas('cycles')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $plans
        ]);
    }
}

