<?php

namespace App\Actions;

use App\Models\Commission;
use App\Models\Cycle;
use App\Models\User;
use App\Models\Ledger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessReferralCommissions
{
    /**
     * Percentuais de comissão por nível
     */
    private const FIRST_PURCHASE_RATES = [
        1 => 15.00,  // Nível 1: 15%
        2 => 2.00,   // Nível 2: 2%
        3 => 1.00,   // Nível 3: 1%
    ];

    private const SUBSEQUENT_PURCHASE_RATES = [
        1 => 8.00,   // Nível 1: 8%
        2 => 2.00,   // Nível 2: 2%
        3 => 1.00,   // Nível 3: 1%
    ];

    /**
     * Processa as comissões de uma compra
     *
     * @param Cycle $cycle
     * @return array Retorna array com informações das comissões processadas
     */
    public function execute(Cycle $cycle): array
    {
        $buyer = $cycle->user;
        $purchaseAmount = $cycle->amount;
        $isFirstPurchase = $cycle->is_first_purchase;
        
        $rates = $isFirstPurchase 
            ? self::FIRST_PURCHASE_RATES 
            : self::SUBSEQUENT_PURCHASE_RATES;
        
        $type = $isFirstPurchase 
            ? 'FIRST_PURCHASE' 
            : 'SUBSEQUENT_PURCHASE';

        $commissionsProcessed = [];

        try {
            DB::beginTransaction();

            // Percorrer a árvore de referrals (até 3 níveis)
            $currentUser = $buyer;
            
            for ($level = 1; $level <= 3; $level++) {
                // Buscar o referrer (upline) deste usuário
                if (!$currentUser->referred_by) {
                    // Não há mais uplines na cadeia
                    break;
                }

                $upline = User::find($currentUser->referred_by);
                
                if (!$upline) {
                    // Upline não encontrado
                    break;
                }

                // Calcular comissão
                $percentage = $rates[$level];
                $commissionAmount = ($purchaseAmount * $percentage) / 100;

                // Criar registro de comissão
                $commission = Commission::create([
                    'user_id' => $upline->id,
                    'from_user_id' => $buyer->id,
                    'cycle_id' => $cycle->id,
                    'level' => $level,
                    'amount' => $commissionAmount,
                    'purchase_amount' => $purchaseAmount,
                    'percentage' => $percentage,
                    'type' => $type,
                    'description' => $this->generateDescription(
                        $buyer->name,
                        $level,
                        $percentage,
                        $isFirstPurchase
                    ),
                ]);

                // Creditar no balance_withdrawn do upline
                $balanceWithdrawnBefore = $upline->balance_withdrawn;
                $upline->balance_withdrawn += $commissionAmount;
                $upline->total_earned += $commissionAmount;
                $upline->save();

                // Registrar no extrato (Ledger)
                Ledger::create([
                    'user_id' => $upline->id,
                    'type' => 'COMMISSION',
                    'reference_type' => Commission::class,
                    'reference_id' => $commission->id,
                    'description' => $commission->description,
                    'amount' => $commissionAmount,
                    'operation' => 'CREDIT',
                    'balance_before' => $balanceWithdrawnBefore,
                    'balance_after' => $upline->balance_withdrawn,
                ]);

                $commissionsProcessed[] = [
                    'upline_id' => $upline->id,
                    'upline_name' => $upline->name,
                    'level' => $level,
                    'amount' => $commissionAmount,
                    'percentage' => $percentage,
                ];

                Log::info("Comissão processada", [
                    'upline_id' => $upline->id,
                    'buyer_id' => $buyer->id,
                    'level' => $level,
                    'amount' => $commissionAmount,
                    'type' => $type,
                ]);

                // Subir para o próximo nível
                $currentUser = $upline;
            }

            DB::commit();

            return [
                'success' => true,
                'commissions' => $commissionsProcessed,
                'total_distributed' => array_sum(array_column($commissionsProcessed, 'amount')),
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error("Erro ao processar comissões", [
                'cycle_id' => $cycle->id,
                'buyer_id' => $buyer->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Gera descrição para o extrato
     */
    private function generateDescription(
        string $buyerName,
        int $level,
        float $percentage,
        bool $isFirstPurchase
    ): string {
        $type = $isFirstPurchase ? 'primeira compra' : 'compra';
        $levelText = $this->getLevelText($level);
        
        return "Comissão de {$percentage}% - {$levelText} - {$type} de {$buyerName}";
    }

    /**
     * Retorna texto do nível
     */
    private function getLevelText(int $level): string
    {
        return match($level) {
            1 => 'Nível 1 (Direto)',
            2 => 'Nível 2 (Indireto)',
            3 => 'Nível 3 (Indireto)',
            default => "Nível {$level}",
        };
    }
}

