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
                'referral_link' => url("/register?ref={$user->referral_code}"),
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

        return response()->json([
            'data' => [
                'referral_code' => $user->referral_code,
                'referral_link' => url("/register?ref={$user->referral_code}"),
                'short_link' => url("/r/{$user->referral_code}"), // Link curto
            ],
        ]);
    }
}
