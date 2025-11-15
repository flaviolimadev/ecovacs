<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class PlanController extends Controller
{
    /**
     * Listar todos os planos (com filtros)
     */
    public function index(Request $request)
    {
        $query = Plan::query();

        // Filtros
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        // Ordenação
        $sortBy = $request->get('sort_by', 'order');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $plans = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $plans->map(function ($plan) {
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
                    'is_featured' => $plan->is_featured,
                    'featured_color' => $plan->featured_color,
                    'featured_ends_at' => $plan->featured_ends_at?->toIso8601String(),
                    'created_at' => $plan->created_at->toIso8601String(),
                    'updated_at' => $plan->updated_at->toIso8601String(),
                ];
            }),
            'meta' => [
                'current_page' => $plans->currentPage(),
                'last_page' => $plans->lastPage(),
                'per_page' => $plans->perPage(),
                'total' => $plans->total(),
            ]
        ]);
    }

    /**
     * Buscar plano específico
     */
    public function show(int $id)
    {
        $plan = Plan::find($id);

        if (!$plan) {
            return response()->json([
                'error' => [
                    'code' => 'PLAN_NOT_FOUND',
                    'message' => 'Plano não encontrado',
                ]
            ], 404);
        }

        return response()->json([
            'data' => [
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
                'is_featured' => $plan->is_featured,
                'featured_color' => $plan->featured_color,
                'featured_ends_at' => $plan->featured_ends_at?->toIso8601String(),
                'created_at' => $plan->created_at->toIso8601String(),
                'updated_at' => $plan->updated_at->toIso8601String(),
            ]
        ]);
    }

    /**
     * Criar novo plano
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'image' => 'required|string|max:255',
            'price' => 'required|numeric|min:0.01',
            'daily_income' => 'nullable|numeric|min:0',
            'duration_days' => 'required|integer|min:1',
            'total_return' => 'required|numeric|min:0',
            'max_purchases' => 'required|integer|min:0',
            'type' => ['required', Rule::in(['DAILY', 'END_CYCLE'])],
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'order' => 'integer|min:0',
            'is_featured' => 'boolean',
            'featured_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'featured_ends_at' => 'nullable|date',
        ]);

        // Validação condicional: se is_featured for true, featured_color é obrigatório
        if ($request->boolean('is_featured') && empty($request->featured_color)) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'A cor do destaque é obrigatória quando o plano está em promoção.',
                ]
            ], 422);
        }

        if ($validator->fails()) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Dados inválidos',
                    'details' => $validator->errors()
                ]
            ], 422);
        }

        try {
            $plan = Plan::create([
                'name' => $request->name,
                'image' => $request->image,
                'price' => $request->price,
                'daily_income' => $request->daily_income,
                'duration_days' => $request->duration_days,
                'total_return' => $request->total_return,
                'max_purchases' => $request->max_purchases ?? 1,
                'type' => $request->type,
                'description' => $request->description,
                'is_active' => $request->boolean('is_active', true),
                'order' => $request->order ?? 0,
                'is_featured' => $request->boolean('is_featured', false),
                'featured_color' => $request->featured_color,
                'featured_ends_at' => $request->featured_ends_at ? now()->parse($request->featured_ends_at) : null,
            ]);

            Log::info('Plano criado pelo admin', [
                'plan_id' => $plan->id,
                'name' => $plan->name,
            ]);

            return response()->json([
                'data' => [
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
                    'is_featured' => $plan->is_featured,
                    'featured_color' => $plan->featured_color,
                    'featured_ends_at' => $plan->featured_ends_at?->toIso8601String(),
                    'created_at' => $plan->created_at->toIso8601String(),
                    'updated_at' => $plan->updated_at->toIso8601String(),
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erro ao criar plano', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => 'Erro ao criar plano: ' . $e->getMessage(),
                ]
            ], 500);
        }
    }

    /**
     * Atualizar plano existente
     */
    public function update(Request $request, int $id)
    {
        $plan = Plan::find($id);

        if (!$plan) {
            return response()->json([
                'error' => [
                    'code' => 'PLAN_NOT_FOUND',
                    'message' => 'Plano não encontrado',
                ]
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'image' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0.01',
            'daily_income' => 'nullable|numeric|min:0',
            'duration_days' => 'sometimes|required|integer|min:1',
            'total_return' => 'sometimes|required|numeric|min:0',
            'max_purchases' => 'sometimes|required|integer|min:0',
            'type' => ['sometimes', 'required', Rule::in(['DAILY', 'END_CYCLE'])],
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'order' => 'integer|min:0',
            'is_featured' => 'boolean',
            'featured_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'featured_ends_at' => 'nullable|date',
        ]);

        // Validação condicional: se is_featured for true, featured_color é obrigatório
        if ($request->has('is_featured') && $request->boolean('is_featured') && empty($request->featured_color)) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'A cor do destaque é obrigatória quando o plano está em promoção.',
                ]
            ], 422);
        }

        if ($validator->fails()) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Dados inválidos',
                    'details' => $validator->errors()
                ]
            ], 422);
        }

        try {
            $updateData = $request->only([
                'name',
                'image',
                'price',
                'daily_income',
                'duration_days',
                'total_return',
                'max_purchases',
                'type',
                'description',
                'is_active',
                'order',
                'is_featured',
                'featured_color',
            ]);

            // Processar campos de promoção
            if ($request->has('is_featured')) {
                if ($request->boolean('is_featured')) {
                    // Se está marcando como promoção, processar featured_ends_at
                    if ($request->has('featured_ends_at')) {
                        $updateData['featured_ends_at'] = $request->featured_ends_at 
                            ? now()->parse($request->featured_ends_at) 
                            : null;
                    }
                } else {
                    // Se está desmarcando promoção, limpar campos
                    $updateData['is_featured'] = false;
                    $updateData['featured_color'] = null;
                    $updateData['featured_ends_at'] = null;
                }
            } else if ($request->has('featured_ends_at')) {
                // Se não mudou is_featured mas mudou featured_ends_at
                $updateData['featured_ends_at'] = $request->featured_ends_at 
                    ? now()->parse($request->featured_ends_at) 
                    : null;
            }

            $plan->update($updateData);

            $plan->refresh();

            Log::info('Plano atualizado pelo admin', [
                'plan_id' => $plan->id,
                'name' => $plan->name,
            ]);

            return response()->json([
                'data' => [
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
                    'is_featured' => $plan->is_featured,
                    'featured_color' => $plan->featured_color,
                    'featured_ends_at' => $plan->featured_ends_at?->toIso8601String(),
                    'created_at' => $plan->created_at->toIso8601String(),
                    'updated_at' => $plan->updated_at->toIso8601String(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao atualizar plano', [
                'plan_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => 'Erro ao atualizar plano: ' . $e->getMessage(),
                ]
            ], 500);
        }
    }

    /**
     * Deletar plano
     */
    public function destroy(int $id)
    {
        $plan = Plan::find($id);

        if (!$plan) {
            return response()->json([
                'error' => [
                    'code' => 'PLAN_NOT_FOUND',
                    'message' => 'Plano não encontrado',
                ]
            ], 404);
        }

        // Verificar se há ciclos ativos usando este plano
        $activeCycles = \App\Models\Cycle::where('plan_id', $plan->id)
            ->where('status', 'ACTIVE')
            ->count();

        if ($activeCycles > 0) {
            return response()->json([
                'error' => [
                    'code' => 'PLAN_IN_USE',
                    'message' => "Não é possível deletar este plano. Existem {$activeCycles} ciclo(s) ativo(s) usando este plano.",
                    'details' => [
                        'active_cycles' => $activeCycles,
                    ]
                ]
            ], 400);
        }

        try {
            $planName = $plan->name;
            $plan->delete();

            Log::info('Plano deletado pelo admin', [
                'plan_id' => $id,
                'name' => $planName,
            ]);

            return response()->json([
                'message' => 'Plano deletado com sucesso',
            ]);

        } catch (\Exception $e) {
            Log::error('Erro ao deletar plano', [
                'plan_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => 'Erro ao deletar plano: ' . $e->getMessage(),
                ]
            ], 500);
        }
    }

    /**
     * Estatísticas de planos
     */
    public function stats()
    {
        $totalPlans = Plan::count();
        $activePlans = Plan::where('is_active', true)->count();
        $inactivePlans = Plan::where('is_active', false)->count();
        $dailyPlans = Plan::where('type', 'DAILY')->count();
        $endCyclePlans = Plan::where('type', 'END_CYCLE')->count();

        return response()->json([
            'data' => [
                'total' => $totalPlans,
                'active' => $activePlans,
                'inactive' => $inactivePlans,
                'by_type' => [
                    'daily' => $dailyPlans,
                    'end_cycle' => $endCyclePlans,
                ],
            ]
        ]);
    }
}

