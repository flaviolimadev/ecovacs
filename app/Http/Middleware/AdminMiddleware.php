<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar se o usuário está autenticado
        if (!$request->user()) {
            return response()->json([
                'error' => [
                    'code' => 'UNAUTHENTICATED',
                    'message' => 'Não autenticado',
                ]
            ], 401);
        }

        // Verificar se o usuário é admin
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Acesso negado. Apenas administradores podem acessar este recurso.',
                ]
            ], 403);
        }

        return $next($request);
    }
}

