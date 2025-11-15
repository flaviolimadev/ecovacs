<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    /**
     * Get all active plans
     */
    public function index(Request $request)
    {
        // Buscar apenas planos ativos, ordenados
        $query = Plan::active()->ordered();

        // Filtrar por tipo se especificado (DAILY ou END_CYCLE)
        if ($request->has('type')) {
            $query->byType($request->type);
        }

        $plans = $query->get();

        // Agrupar por tipo e incluir informações de promoção
        $groupedPlans = [
            'standard' => $plans->where('type', 'DAILY')->map(function ($plan) {
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
                    'is_promotion_active' => $plan->isPromotionActive(),
                ];
            })->values(),
            'cycle' => $plans->where('type', 'END_CYCLE')->map(function ($plan) {
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
                    'is_promotion_active' => $plan->isPromotionActive(),
                ];
            })->values(),
        ];

        return response()->json([
            'message' => 'Planos carregados com sucesso',
            'data' => $groupedPlans,
        ]);
    }

    /**
     * Get single plan by ID
     */
    public function show($id)
    {
        $plan = Plan::active()->find($id);

        if (!$plan) {
            return response()->json([
                'message' => 'Plano não encontrado',
            ], 404);
        }

        return response()->json([
            'message' => 'Plano encontrado',
            'data' => $plan,
        ]);
    }
}
