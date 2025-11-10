<?php

use App\Http\Controllers\API\V1\AuthController;
use App\Http\Controllers\API\V1\ProfileController;
use App\Http\Controllers\API\V1\NetworkController;
use App\Http\Controllers\API\V1\PlanController;
use App\Http\Controllers\API\V1\InvestmentController;
use App\Http\Controllers\API\V1\DailyRewardController;
use App\Http\Controllers\API\V1\DepositController;
use Illuminate\Support\Facades\Route;

/**
 * API Routes (versão 1)
 * 
 * Todas as rotas de API começam com /api/v1
 * Estas rotas não precisam de CSRF e retornam JSON.
 */

Route::prefix('v1')->group(function () {
    // Rotas públicas (sem autenticação)
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    
    // Webhook Vizzion (público - não requer autenticação)
    Route::post('/deposits/webhook', [DepositController::class, 'webhook'])->name('api.v1.deposits.webhook');

    // Rotas protegidas (requer autenticação)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        
        // Profile
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
        Route::get('/profile/statement', [ProfileController::class, 'statement']);
        
        // Network (Referrals/Members)
        Route::get('/network/stats', [NetworkController::class, 'stats']);
        Route::get('/network/tree', [NetworkController::class, 'tree']);
        Route::get('/network/referral-link', [NetworkController::class, 'referralLink']);
        Route::get('/network/commission-details', [NetworkController::class, 'commissionDetails']);
        
        // Plans
        Route::get('/plans', [PlanController::class, 'index']);
        Route::get('/plans/{id}', [PlanController::class, 'show']);
        
        // Investments
        Route::get('/investments', [InvestmentController::class, 'index']);
        Route::get('/investments/stats', [InvestmentController::class, 'stats']); // IMPORTANTE: Vir antes de {id}
        Route::post('/investments', [InvestmentController::class, 'store']);
        Route::get('/investments/{id}', [InvestmentController::class, 'show']);
        
        // Daily Reward
        Route::get('/daily-reward/status', [DailyRewardController::class, 'status']);
        Route::post('/daily-reward/claim', [DailyRewardController::class, 'claim']);
        
        // Deposits
        Route::get('/deposits', [DepositController::class, 'index']);
        Route::post('/deposits', [DepositController::class, 'store']);
        Route::get('/deposits/{id}', [DepositController::class, 'show']);
        Route::post('/deposits/{id}/check-status', [DepositController::class, 'checkStatus']);

        // Settings (TODO)
        Route::get('/settings', function () {
            return response()->json(['message' => 'Settings endpoint - TODO']);
        });
        
        // Statement (TODO)
        Route::get('/statement', function () {
            return response()->json(['message' => 'Statement endpoint - TODO']);
        });
        
        // Withdrawals (TODO)
        Route::post('/withdrawals', function () {
            return response()->json(['message' => 'Withdrawal request - TODO']);
        });
    });
});

