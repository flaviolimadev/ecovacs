<?php

use Illuminate\Support\Facades\Route;

/**
 * SPA Fallback Route
 * 
 * O React Router controla todas as rotas do front-end.
 * Esta rota captura TODAS as requisições que não são /api/*
 * e retorna a view app.blade.php (que carrega o React).
 */
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
