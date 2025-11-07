<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NetworkController extends Controller
{
    /**
     * Get network statistics
     */
    public function stats(Request $request)
    {
        $user = $request->user();

        // Buscar estatísticas por nível
        $levelStats = [];
        $totalActiveMembers = 0;
        $totalInactiveMembers = 0;
        
        for ($level = 1; $level <= 3; $level++) {
            $referrals = Referral::where('user_id', $user->id)
                ->where('level', $level)
                ->with(['referredUser.cycles'])
                ->get();

            $totalMembers = $referrals->count();
            $activeMembers = 0;
            $inactiveMembers = 0;
            $totalDeposits = 0;

            foreach ($referrals as $referral) {
                $referredUser = $referral->referredUser;
                $totalDeposits += $referredUser->total_invested ?? 0;
                
                // Verificar se tem investimentos
                $hasInvestments = $referredUser->cycles()->exists();
                if ($hasInvestments) {
                    $activeMembers++;
                    $totalActiveMembers++;
                } else {
                    $inactiveMembers++;
                    $totalInactiveMembers++;
                }
            }

            $levelStats[] = [
                'level' => $level,
                'level_name' => chr(64 + $level), // A, B, C
                'members' => $totalMembers,
                'active_members' => $activeMembers,
                'inactive_members' => $inactiveMembers,
                'total_deposits' => (float) $totalDeposits,
            ];
        }

        // Total geral
        $totalMembers = Referral::where('user_id', $user->id)->count();
        $directMembers = Referral::where('user_id', $user->id)
            ->where('level', 1)
            ->count();

        return response()->json([
            'data' => [
                'levels' => $levelStats,
                'total_members' => $totalMembers,
                'active_members' => $totalActiveMembers,
                'inactive_members' => $totalInactiveMembers,
                'direct_members' => $directMembers,
                'referral_code' => $user->referral_code,
                'referral_link' => config('app.frontend_url') . "/register?ref={$user->referral_code}",
            ],
        ]);
    }

    /**
     * Get network tree (members list)
     */
    public function tree(Request $request)
    {
        $user = $request->user();
        $level = $request->query('level', null);

        // Query base - carregar relacionamento cycles para verificar status
        $query = Referral::where('user_id', $user->id)
            ->with(['referredUser.cycles']);

        // Filtrar por nível se especificado
        if ($level !== null && $level > 0) {
            $query->where('level', $level);
        }

        $referrals = $query->get();

        $members = $referrals->map(function ($referral) {
            $referredUser = $referral->referredUser;
            
            // Verificar se usuário está ativo (tem pelo menos 1 investimento)
            $hasInvestments = $referredUser->cycles()->exists();
            $userStatus = $hasInvestments ? 'active' : 'inactive';
            
            // Contar investimentos ativos
            $activeCycles = $referredUser->cycles()->where('status', 'ACTIVE')->count();
            
            return [
                'id' => $referredUser->id,
                'name' => $referredUser->name,
                'email' => $referredUser->email,
                'level' => $referral->level,
                'level_name' => chr(64 + $referral->level), // A, B, C
                'total_invested' => (float) ($referredUser->total_invested ?? 0),
                'total_earned' => (float) ($referredUser->total_earned ?? 0),
                'referral_code' => $referredUser->referral_code,
                'created_at' => $referredUser->created_at,
                'is_active' => $hasInvestments, // Baseado em ter pelo menos 1 investimento
                'user_status' => $userStatus, // "active" ou "inactive"
                'active_cycles' => $activeCycles, // Quantidade de ciclos ativos
            ];
        });

        return response()->json([
            'data' => $members,
        ]);
    }

    /**
     * Get referral link and QR code info
     */
    public function referralLink(Request $request)
    {
        $user = $request->user();
        $frontendUrl = config('app.frontend_url');

        return response()->json([
            'data' => [
                'referral_code' => $user->referral_code,
                'referral_link' => $frontendUrl . "/register?ref={$user->referral_code}",
                'short_link' => $frontendUrl . "/r/{$user->referral_code}", // Link curto
            ],
        ]);
    }

    /**
     * Get commission details and earnings
     */
    public function commissionDetails(Request $request)
    {
        $user = $request->user();

        // Buscar comissões agrupadas por tipo
        $commissionsData = DB::table('commissions')
            ->where('user_id', $user->id)
            ->selectRaw("
                type,
                COUNT(*) as total_count,
                SUM(amount) as total_earned,
                AVG(percentage) as avg_percentage
            ")
            ->groupBy('type')
            ->get();

        // Organizar dados
        $firstPurchaseData = $commissionsData->firstWhere('type', 'FIRST_PURCHASE');
        $subsequentPurchaseData = $commissionsData->firstWhere('type', 'SUBSEQUENT_PURCHASE');

        // Buscar comissões por nível (para primeira compra)
        $firstPurchaseByLevel = DB::table('commissions')
            ->where('user_id', $user->id)
            ->where('type', 'FIRST_PURCHASE')
            ->selectRaw("
                level,
                COUNT(*) as count,
                SUM(amount) as total,
                AVG(percentage) as percentage
            ")
            ->groupBy('level')
            ->orderBy('level')
            ->get();

        // Buscar comissões por nível (para compras subsequentes)
        $subsequentByLevel = DB::table('commissions')
            ->where('user_id', $user->id)
            ->where('type', 'SUBSEQUENT_PURCHASE')
            ->selectRaw("
                level,
                COUNT(*) as count,
                SUM(amount) as total,
                AVG(percentage) as percentage
            ")
            ->groupBy('level')
            ->orderBy('level')
            ->get();

        // Total geral de comissões
        $totalCommissions = $user->commissionsReceived()->sum('amount');

        return response()->json([
            'data' => [
                'summary' => [
                    'total_earned' => (float) $totalCommissions,
                    'first_purchase_total' => (float) ($firstPurchaseData->total_earned ?? 0),
                    'subsequent_purchase_total' => (float) ($subsequentPurchaseData->total_earned ?? 0),
                    'total_commissions_count' => $user->commissionsReceived()->count(),
                ],
                'first_purchase' => [
                    'total' => (float) ($firstPurchaseData->total_earned ?? 0),
                    'count' => $firstPurchaseData->total_count ?? 0,
                    'by_level' => $firstPurchaseByLevel->map(function ($item) {
                        return [
                            'level' => $item->level,
                            'percentage' => (float) $item->percentage,
                            'count' => $item->count,
                            'total' => (float) $item->total,
                        ];
                    }),
                ],
                'subsequent_purchase' => [
                    'total' => (float) ($subsequentPurchaseData->total_earned ?? 0),
                    'count' => $subsequentPurchaseData->total_count ?? 0,
                    'by_level' => $subsequentByLevel->map(function ($item) {
                        return [
                            'level' => $item->level,
                            'percentage' => (float) $item->percentage,
                            'count' => $item->count,
                            'total' => (float) $item->total,
                        ];
                    }),
                ],
                'percentages_config' => [
                    'first_purchase' => [
                        ['level' => 1, 'percentage' => 15.00],
                        ['level' => 2, 'percentage' => 2.00],
                        ['level' => 3, 'percentage' => 1.00],
                    ],
                    'subsequent_purchase' => [
                        ['level' => 1, 'percentage' => 8.00],
                        ['level' => 2, 'percentage' => 2.00],
                        ['level' => 3, 'percentage' => 1.00],
                    ],
                ],
            ],
        ]);
    }
}
