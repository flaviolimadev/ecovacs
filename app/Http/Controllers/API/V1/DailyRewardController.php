<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\DailyReward;
use App\Models\Ledger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DailyRewardController extends Controller
{
    /**
     * Verificar status do prêmio diário
     */
    public function status(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today();

        // Verificar se já fez claim hoje
        $todayClaim = DailyReward::where('user_id', $user->id)
            ->where('claim_date', $today)
            ->first();

        $canClaim = !$todayClaim;

        // Buscar histórico dos últimos 7 dias
        $history = DailyReward::where('user_id', $user->id)
            ->where('claim_date', '>=', $today->copy()->subDays(6))
            ->orderBy('claim_date', 'desc')
            ->get()
            ->map(function ($reward) {
                return [
                    'date' => $reward->claim_date->format('Y-m-d'),
                    'amount' => (float) $reward->amount,
                    'claimed' => true,
                ];
            });

        // Total ganho
        $totalEarned = DailyReward::where('user_id', $user->id)->sum('amount');

        // Sequência (dias consecutivos)
        $streak = $this->calculateStreak($user->id);

        return response()->json([
            'data' => [
                'can_claim' => $canClaim,
                'today_claimed' => !$canClaim,
                'reward_amount' => 0.50,
                'total_earned' => (float) $totalEarned,
                'current_streak' => $streak,
                'history' => $history,
            ],
        ]);
    }

    /**
     * Fazer claim do prêmio diário
     */
    public function claim(Request $request)
    {
        try {
            DB::beginTransaction();

            $user = $request->user();
            $today = Carbon::today();
            $rewardAmount = 0.50;

            // Verificar se já fez claim hoje
            $existingClaim = DailyReward::where('user_id', $user->id)
                ->where('claim_date', $today)
                ->first();

            if ($existingClaim) {
                return response()->json([
                    'message' => 'Você já resgatou seu prêmio diário hoje!',
                    'error' => 'ALREADY_CLAIMED_TODAY',
                ], 422);
            }

            // Criar registro de claim
            $dailyReward = DailyReward::create([
                'user_id' => $user->id,
                'claim_date' => $today,
                'amount' => $rewardAmount,
            ]);

            // Adicionar ao balance_withdrawn
            $balanceBefore = $user->balance_withdrawn;
            $user->balance_withdrawn += $rewardAmount;
            $user->total_earned += $rewardAmount;
            $user->save();

            // Registrar no extrato (Ledger)
            Ledger::create([
                'user_id' => $user->id,
                'type' => 'DAILY_REWARD',
                'reference_type' => DailyReward::class,
                'reference_id' => $dailyReward->id,
                'description' => 'Prêmio diário - Atividade do dia',
                'amount' => $rewardAmount,
                'operation' => 'CREDIT',
                'balance_before' => $balanceBefore,
                'balance_after' => $user->balance_withdrawn,
            ]);

            DB::commit();

            // Calcular nova sequência
            $streak = $this->calculateStreak($user->id);

            return response()->json([
                'message' => '🎉 Prêmio diário resgatado com sucesso!',
                'data' => [
                    'amount' => (float) $rewardAmount,
                    'new_balance' => (float) $user->balance_withdrawn,
                    'current_streak' => $streak,
                    'claimed_at' => $dailyReward->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Erro ao resgatar prêmio diário',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calcular sequência de dias consecutivos
     */
    private function calculateStreak(int $userId): int
    {
        $streak = 0;
        $currentDate = Carbon::today();

        while (true) {
            $claim = DailyReward::where('user_id', $userId)
                ->where('claim_date', $currentDate)
                ->exists();

            if (!$claim) {
                break;
            }

            $streak++;
            $currentDate = $currentDate->subDay();
        }

        return $streak;
    }
}
