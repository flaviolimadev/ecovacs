<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Cycle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PackageController extends Controller
{
    /**
     * Estatísticas gerais de pacotes/planos
     */
    public function stats()
    {
        $totalPlans = Plan::count();
        $activePlans = Plan::where('is_active', true)->count();
        $totalCycles = Cycle::count();
        $activeCycles = Cycle::where('status', 'ACTIVE')->count();
        $finishedCycles = Cycle::where('status', 'FINISHED')->count();
        $cancelledCycles = Cycle::where('status', 'CANCELLED')->count();

        $totalInvested = Cycle::sum('amount');
        $totalReturn = Cycle::sum('total_return');
        $totalPaid = Cycle::sum('total_paid');

        return response()->json([
            'data' => [
                'plans' => [
                    'total' => $totalPlans,
                    'active' => $activePlans,
                ],
                'cycles' => [
                    'total' => $totalCycles,
                    'active' => $activeCycles,
                    'finished' => $finishedCycles,
                    'cancelled' => $cancelledCycles,
                ],
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
     * Listar planos com estatísticas de vendas
     */
    public function index(Request $request)
    {
        $search = $request->get('search');
        $type = $request->get('type'); // DAILY, END_CYCLE ou null
        $isActive = $request->get('is_active'); // true, false ou null

        $query = Plan::query();

        // Busca por nome
        if ($search) {
            $query->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($search) . '%']);
        }

        // Filtro por tipo
        if ($type) {
            $query->where('type', $type);
        }

        // Filtro por status ativo
        if ($isActive !== null) {
            $query->where('is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
        }

        $plans = $query->orderBy('order')->orderBy('name')->get();

        $plansWithStats = $plans->map(function ($plan) {
            $cycles = Cycle::where('plan_id', $plan->id)->get();
            
            $totalSold = $cycles->count();
            $active = $cycles->where('status', 'ACTIVE')->count();
            $finished = $cycles->where('status', 'FINISHED')->count();
            $cancelled = $cycles->where('status', 'CANCELLED')->count();

            $totalInvested = $cycles->sum('amount');
            $totalReturn = $cycles->sum('total_return');
            $totalPaid = $cycles->sum('total_paid');

            return [
                'id' => $plan->id,
                'name' => $plan->name,
                'image' => $plan->image,
                'price' => (float) $plan->price,
                'daily_income' => $plan->daily_income ? (float) $plan->daily_income : null,
                'duration_days' => $plan->duration_days,
                'total_return' => (float) $plan->total_return,
                'max_purchases' => $plan->max_purchases,
                'type' => $plan->type,
                'description' => $plan->description,
                'is_active' => $plan->is_active,
                'order' => $plan->order,
                'created_at' => $plan->created_at->toIso8601String(),
                'stats' => [
                    'total_sold' => $totalSold,
                    'active' => $active,
                    'finished' => $finished,
                    'cancelled' => $cancelled,
                    'total_invested' => (float) $totalInvested,
                    'total_return' => (float) $totalReturn,
                    'total_paid' => (float) $totalPaid,
                    'pending_return' => (float) ($totalReturn - $totalPaid),
                ],
            ];
        });

        return response()->json([
            'data' => $plansWithStats->values(),
        ]);
    }

    /**
     * Detalhes de um plano específico com lista de ciclos
     */
    public function show(int $id, Request $request)
    {
        $plan = Plan::findOrFail($id);

        $status = $request->get('status'); // ACTIVE, FINISHED, CANCELLED ou null
        $search = $request->get('search');
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 20);

        $cyclesQuery = Cycle::where('plan_id', $id)
            ->with(['user:id,name,email']);

        // Filtro por status
        if ($status) {
            $cyclesQuery->where('status', $status);
        }

        // Busca por nome/email do usuário
        if ($search) {
            $cyclesQuery->whereHas('user', function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($search) . '%'])
                  ->orWhereRaw('LOWER(email) LIKE ?', ['%' . strtolower($search) . '%']);
            });
        }

        $cycles = $cyclesQuery->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Estatísticas do plano
        $allCycles = Cycle::where('plan_id', $id)->get();
        $stats = [
            'total_sold' => $allCycles->count(),
            'active' => $allCycles->where('status', 'ACTIVE')->count(),
            'finished' => $allCycles->where('status', 'FINISHED')->count(),
            'cancelled' => $allCycles->where('status', 'CANCELLED')->count(),
            'total_invested' => (float) $allCycles->sum('amount'),
            'total_return' => (float) $allCycles->sum('total_return'),
            'total_paid' => (float) $allCycles->sum('total_paid'),
            'pending_return' => (float) ($allCycles->sum('total_return') - $allCycles->sum('total_paid')),
        ];

        return response()->json([
            'data' => [
                'plan' => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'image' => $plan->image,
                    'price' => (float) $plan->price,
                    'daily_income' => $plan->daily_income ? (float) $plan->daily_income : null,
                    'duration_days' => $plan->duration_days,
                    'total_return' => (float) $plan->total_return,
                    'max_purchases' => $plan->max_purchases,
                    'type' => $plan->type,
                    'description' => $plan->description,
                    'is_active' => $plan->is_active,
                    'order' => $plan->order,
                    'created_at' => $plan->created_at->toIso8601String(),
                ],
                'stats' => $stats,
                'cycles' => $cycles->map(function ($cycle) {
                    return [
                        'id' => $cycle->id,
                        'user' => [
                            'id' => $cycle->user->id,
                            'name' => $cycle->user->name,
                            'email' => $cycle->user->email,
                        ],
                        'amount' => (float) $cycle->amount,
                        'type' => $cycle->type,
                        'status' => $cycle->status,
                        'duration_days' => $cycle->duration_days,
                        'days_paid' => $cycle->days_paid,
                        'daily_income' => $cycle->daily_income ? (float) $cycle->daily_income : null,
                        'total_return' => (float) $cycle->total_return,
                        'total_paid' => (float) $cycle->total_paid,
                        'started_at' => $cycle->started_at ? $cycle->started_at->toIso8601String() : null,
                        'ends_at' => $cycle->ends_at ? $cycle->ends_at->toIso8601String() : null,
                        'created_at' => $cycle->created_at->toIso8601String(),
                    ];
                }),
                'meta' => [
                    'current_page' => $cycles->currentPage(),
                    'last_page' => $cycles->lastPage(),
                    'per_page' => $cycles->perPage(),
                    'total' => $cycles->total(),
                ],
            ]
        ]);
    }
}

