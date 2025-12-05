<?php

use App\Http\Controllers\API\V1\AuthController;
use App\Http\Controllers\API\V1\ProfileController;
use App\Http\Controllers\API\V1\NetworkController;
use App\Http\Controllers\API\V1\PlanController;
use App\Http\Controllers\API\V1\InvestmentController;
use App\Http\Controllers\API\V1\DailyRewardController;
use App\Http\Controllers\API\V1\DepositController;
use App\Http\Controllers\API\V1\WithdrawController;
use App\Http\Controllers\API\V1\WebhookController;
use App\Http\Controllers\API\V1\Admin\UserController as AdminUserController;
use App\Http\Controllers\API\V1\Admin\WithdrawalController as AdminWithdrawalController;
use App\Http\Controllers\API\V1\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\API\V1\Admin\PlanController as AdminPlanController;
use App\Http\Controllers\API\V1\Admin\UploadController as AdminUploadController;
use App\Http\Controllers\API\V1\Admin\PackageController;
use App\Http\Controllers\API\V1\Admin\DepositController as AdminDepositController;
use App\Http\Controllers\API\V1\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\API\V1\Admin\CycleController as AdminCycleController;
use App\Http\Controllers\API\V1\Admin\WebhookController as AdminWebhookController;
use App\Http\Controllers\API\V1\Admin\TopRecruiterController as AdminTopRecruiterController;
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
    Route::post('/webhooks/vizzion', [WebhookController::class, 'vizzion'])->name('api.v1.webhooks.vizzion');

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
        Route::get('/network/members', [NetworkController::class, 'tree']); // Alias para tree (lista de membros)
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

        // Withdrawals
        Route::get('/withdrawals/settings', [WithdrawController::class, 'settings']);
        Route::get('/withdrawals', [WithdrawController::class, 'index']);
        Route::post('/withdrawals', [WithdrawController::class, 'store']);
        Route::get('/withdrawals/{id}', [WithdrawController::class, 'show']);

        // Admin Routes (protegidas por middleware admin)
        Route::prefix('admin')->middleware('admin')->group(function () {
            // Dashboard
            Route::get('/dashboard/stats', [AdminDashboardController::class, 'stats']);
            Route::get('/dashboard/recent-deposits', [AdminDashboardController::class, 'recentDeposits']);

            // Usuários
            Route::get('/users/stats', [AdminUserController::class, 'stats']);
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::get('/users/{id}', [AdminUserController::class, 'show']);
            Route::put('/users/{id}', [AdminUserController::class, 'update']);
            Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
            Route::post('/users/{id}/adjust-balance', [AdminUserController::class, 'adjustBalance']);

            // Saques (Withdrawals)
            Route::get('/withdrawals/stats', [AdminWithdrawalController::class, 'stats']);
            Route::get('/withdrawals', [AdminWithdrawalController::class, 'index']);
            Route::get('/withdrawals/{id}', [AdminWithdrawalController::class, 'show']);
            Route::post('/withdrawals/{id}/approve', [AdminWithdrawalController::class, 'approve']);
            Route::post('/withdrawals/{id}/process-vizzion', [AdminWithdrawalController::class, 'processVizzionPayment']);
            Route::post('/withdrawals/{id}/mark-as-paid', [AdminWithdrawalController::class, 'markAsPaid']);
            Route::post('/withdrawals/{id}/reject', [AdminWithdrawalController::class, 'reject']);
            Route::delete('/withdrawals/{id}', [AdminWithdrawalController::class, 'destroy']);

            // Depósitos (Deposits)
            Route::get('/deposits', [AdminDepositController::class, 'index']);
            Route::get('/deposits/stats', [AdminDepositController::class, 'stats']);
            Route::get('/deposits/{id}', [AdminDepositController::class, 'show']);
            Route::post('/deposits/{id}/mark-as-paid', [AdminDepositController::class, 'markAsPaid']);
            Route::post('/deposits/{id}/mark-as-cancelled', [AdminDepositController::class, 'markAsCancelled']);
            Route::post('/deposits/{id}/mark-as-pending', [AdminDepositController::class, 'markAsPending']);

            // Configurações (Settings)
            Route::get('/settings', [AdminSettingsController::class, 'index']);
            Route::put('/settings', [AdminSettingsController::class, 'update']);
            Route::put('/settings/bulk', [AdminSettingsController::class, 'updateBulk']);
            Route::get('/settings/withdraw', [AdminSettingsController::class, 'getWithdrawSettings']);
            Route::put('/settings/withdraw', [AdminSettingsController::class, 'updateWithdrawSettings']);

            // Planos (Plans)
            Route::get('/plans/stats', [AdminPlanController::class, 'stats']);
            Route::get('/plans', [AdminPlanController::class, 'index']);
            Route::post('/plans', [AdminPlanController::class, 'store']);
            Route::get('/plans/{id}', [AdminPlanController::class, 'show']);
            Route::put('/plans/{id}', [AdminPlanController::class, 'update']);
            Route::delete('/plans/{id}', [AdminPlanController::class, 'destroy']);
            
            // Upload
            Route::post('/upload/image', [AdminUploadController::class, 'uploadImage']);

            // Pacotes/Planos - Estatísticas
            Route::get('/packages/stats', [PackageController::class, 'stats']);
            Route::get('/packages', [PackageController::class, 'index']);
            Route::get('/packages/{id}', [PackageController::class, 'show']);

            // Ciclos/Investimentos (Cycles)
            Route::get('/cycles/stats', [AdminCycleController::class, 'stats']);
            Route::get('/cycles', [AdminCycleController::class, 'index']);
            Route::get('/cycles/{id}', [AdminCycleController::class, 'show']);
            Route::post('/cycles/{id}/activate', [AdminCycleController::class, 'activate']);
            Route::post('/cycles/{id}/cancel', [AdminCycleController::class, 'cancel']);
            Route::delete('/cycles/{id}', [AdminCycleController::class, 'destroy']);
            Route::get('/cycles-filters/users', [AdminCycleController::class, 'usersList']);
            Route::get('/cycles-filters/plans', [AdminCycleController::class, 'plansList']);

            // Webhooks
            Route::get('/webhooks/stats', [AdminWebhookController::class, 'stats']);
            Route::get('/webhooks/paid-without-webhook', [AdminWebhookController::class, 'paidWithoutWebhook']);
            Route::get('/webhooks', [AdminWebhookController::class, 'index']);
            Route::get('/webhooks/{id}', [AdminWebhookController::class, 'show']);

            // Top Recrutadores (MLM)
            Route::get('/top-recruiters/stats', [AdminTopRecruiterController::class, 'stats']);
            Route::get('/top-recruiters/by-network', [AdminTopRecruiterController::class, 'byNetwork']);
            Route::get('/top-recruiters/by-commissions', [AdminTopRecruiterController::class, 'byCommissions']);
        });

        // Settings (TODO)
        Route::get('/settings', function () {
            return response()->json(['message' => 'Settings endpoint - TODO']);
        });
        
        // Statement (TODO)
        Route::get('/statement', function () {
            return response()->json(['message' => 'Statement endpoint - TODO']);
        });
    });
});

