<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                // Se for uma requisição de API, retornar JSON
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'error' => [
                            'code' => 'ALREADY_AUTHENTICATED',
                            'message' => 'Você já está autenticado.',
                        ]
                    ], 400);
                }
                
                return redirect('/');
            }
        }

        return $next($request);
    }
}

