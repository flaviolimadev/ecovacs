<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Deposit;
use App\Models\Withdrawal;
use App\Models\Cycle;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function stats(): JsonResponse
    {
        try {
            $now = Carbon::now(config('app.timezone'));
            $startOfDay = $now->copy()->startOfDay();

            // Total de usuários
            $totalUsers = User::count();
            $newUsersToday = User::whereDate('created_at', $startOfDay)->count();

            // Total depositado (apenas PAID)
            $totalDeposited = Deposit::where('status', 'PAID')->sum('amount');
            $pendingDeposits = Deposit::where('status', 'PENDING')->count();

            // Total sacado (apenas PAID)
            $totalWithdrawn = Withdrawal::where('status', 'PAID')->sum('amount');
            $pendingWithdrawals = Withdrawal::whereIn('status', ['REQUESTED', 'APPROVED'])->count();

            // Saldo total disponível para saque (soma de balance_withdrawn de todos os usuários)
            $totalBalance = User::sum('balance_withdrawn');

            // Total investido (soma de todos os cycles)
            $totalInvested = Cycle::sum('amount');

            return response()->json([
                'total_users' => $totalUsers,
                'new_users_today' => $newUsersToday,
                'total_deposited' => (float) $totalDeposited,
                'pending_deposits' => $pendingDeposits,
                'total_withdrawn' => (float) $totalWithdrawn,
                'pending_withdrawals' => $pendingWithdrawals,
                'total_balance' => (float) $totalBalance,
                'total_invested' => (float) $totalInvested,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching dashboard stats: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao buscar estatísticas',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get recent deposits
     */
    public function recentDeposits(): JsonResponse
    {
        try {
            $deposits = Deposit::with('user:id,name')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($deposit) {
                    return [
                        'id' => $deposit->id,
                        'user_name' => $deposit->user ? $deposit->user->name : 'Usuário desconhecido',
                        'amount' => (float) $deposit->amount,
                        'status' => $deposit->status,
                        'created_at' => Carbon::parse($deposit->created_at)
                            ->setTimezone(config('app.timezone'))
                            ->toIso8601String(),
                    ];
                });

            return response()->json([
                'data' => $deposits,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching recent deposits: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erro ao buscar depósitos recentes',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}

