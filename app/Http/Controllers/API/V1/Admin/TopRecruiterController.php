<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Ledger;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TopRecruiterController extends Controller
{
    /**
     * Top 10 recrutadores por tamanho da rede (diretos + indiretos)
     */
    public function byNetwork()
    {
        // Buscar usuários com maior rede
        $topRecruiters = User::select('users.*')
            ->withCount([
                'referrals as total_network' // Total de pessoas na rede (diretos + todos os níveis)
            ])
            ->having('total_network', '>', 0)
            ->orderBy('total_network', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($user) {
                // Calcular comissões totais
                $totalCommissions = Ledger::where('user_id', $user->id)
                    ->where('type', 'COMMISSION')
                    ->sum('amount');

                // Calcular saques realizados
                $totalWithdrawn = Withdrawal::where('user_id', $user->id)
                    ->whereIn('status', ['PAID', 'APPROVED'])
                    ->sum('amount');

                // Contar diretos (nível 1)
                $directReferrals = User::where('referred_by', $user->id)->count();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'referral_code' => $user->referral_code,
                    'created_at' => $user->created_at->toIso8601String(),
                    'direct_referrals' => $directReferrals,
                    'total_network' => $user->total_network,
                    'total_commissions' => (float) $totalCommissions,
                    'total_withdrawn' => (float) $totalWithdrawn,
                    'balance_withdrawn' => (float) $user->balance_withdrawn,
                ];
            });

        return response()->json([
            'data' => $topRecruiters
        ]);
    }

    /**
     * Top 10 recrutadores por comissões ganhas
     */
    public function byCommissions()
    {
        // Buscar usuários que mais ganharam comissões
        $topEarners = User::select('users.*')
            ->join('ledger', 'users.id', '=', 'ledger.user_id')
            ->where('ledger.type', 'COMMISSION')
            ->groupBy('users.id')
            ->selectRaw('users.*, SUM(ledger.amount) as total_commissions')
            ->orderBy('total_commissions', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($user) {
                // Calcular saques realizados
                $totalWithdrawn = Withdrawal::where('user_id', $user->id)
                    ->whereIn('status', ['PAID', 'APPROVED'])
                    ->sum('amount');

                // Contar rede
                $totalNetwork = User::where('referred_by', $user->id)->count();
                $directReferrals = $totalNetwork;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'referral_code' => $user->referral_code,
                    'created_at' => $user->created_at->toIso8601String(),
                    'direct_referrals' => $directReferrals,
                    'total_network' => $totalNetwork,
                    'total_commissions' => (float) $user->total_commissions,
                    'total_withdrawn' => (float) $totalWithdrawn,
                    'balance_withdrawn' => (float) $user->balance_withdrawn,
                ];
            });

        return response()->json([
            'data' => $topEarners
        ]);
    }

    /**
     * Estatísticas gerais do MLM
     */
    public function stats()
    {
        // Total de comissões distribuídas
        $totalCommissions = Ledger::where('type', 'COMMISSION')->sum('amount');

        // Total de saques de comissões
        $totalWithdrawn = Withdrawal::whereIn('status', ['PAID', 'APPROVED'])->sum('amount');

        // Número de recrutadores ativos (com pelo menos 1 indicado)
        $activeRecruiters = User::has('referrals')->count();

        // Total de usuários na rede
        $totalUsers = User::whereNotNull('referred_by')->count();

        // Média de comissões por recrutador
        $avgCommissionsPerRecruiter = $activeRecruiters > 0 
            ? $totalCommissions / $activeRecruiters 
            : 0;

        return response()->json([
            'data' => [
                'total_commissions_distributed' => (float) $totalCommissions,
                'total_withdrawn' => (float) $totalWithdrawn,
                'active_recruiters' => $activeRecruiters,
                'total_users_in_network' => $totalUsers,
                'avg_commissions_per_recruiter' => (float) $avgCommissionsPerRecruiter,
            ]
        ]);
    }
}
