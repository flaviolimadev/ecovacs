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

        // Agrupar por tipo
        $groupedPlans = [
            'standard' => $plans->where('type', 'DAILY')->values(),
            'cycle' => $plans->where('type', 'END_CYCLE')->values(),
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
