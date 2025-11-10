<?php

use Illuminate\Support\Facades\Route;

/**
 * Web Routes (apenas fallback SPA)
 * 
 * Rotas de API estão em routes/api.php
 */

// Fallback: qualquer rota não-API redireciona para o frontend
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');

// Rota nomeada "login" para evitar erros do Laravel
Route::get('/login', function () {
    return response()->json([
        'error' => [
            'code' => 'API_ONLY',
            'message' => 'Esta é uma API. Use POST /api/v1/auth/login para autenticar.',
            'endpoint' => '/api/v1/auth/login',
        ]
    ], 400);
})->name('login');
