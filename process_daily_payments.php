#!/usr/bin/env php
<?php

/**
 * Script para processar pagamentos diários de ciclos
 * - Paga 1 rendimento por dia (não acumula atrasados)
 * - Verifica se já pagou hoje
 * - Calcula e paga residuais automaticamente
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Cycle;
use App\Models\User;
use App\Models\Ledger;
use App\Models\Earning;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

echo "\n";
echo "===========================================\n";
echo "  PROCESSAMENTO DE PAGAMENTOS DIÁRIOS\n";
echo "===========================================\n";
echo "Iniciado em: " . now()->format('d/m/Y H:i:s') . "\n";
echo "\n";

// Buscar residual tiers do banco
$residualTiers = DB::table('residual_tiers')
    ->where('scheme_id', 1) // Assumindo scheme_id = 1 (ajustar se necessário)
    ->orderBy('level')
    ->pluck('percent', 'level')
    ->toArray();

if (empty($residualTiers)) {
    echo "⚠️  AVISO: Nenhum residual_tier encontrado. Residuais não serão pagos.\n\n";
}

// Buscar todos os ciclos ATIVOS
$cycles = Cycle::where('status', 'ACTIVE')
    ->with(['user', 'plan'])
    ->orderBy('started_at', 'asc')
    ->get();

if ($cycles->isEmpty()) {
    echo "❌ Nenhum ciclo ATIVO encontrado.\n\n";
    exit(0);
}

echo "Total de ciclos ATIVOS: " . $cycles->count() . "\n";
echo "\n";

$stats = [
    'cycles_processed' => 0,
    'cycles_skipped_time' => 0,
    'cycles_skipped_already_paid' => 0,
    'cycles_completed' => 0,
    'total_earnings_paid' => 0,
    'total_residuals_paid' => 0,
    'users_benefited' => [],
    'errors' => 0,
];

foreach ($cycles as $cycle) {
    try {
        $now = Carbon::now();
        $startedAt = Carbon::parse($cycle->started_at);
        $hoursElapsed = $startedAt->diffInHours($now);
        
        // 1. Verificar se faz mais de 24h
        if ($hoursElapsed < 24) {
            $stats['cycles_skipped_time']++;
            continue;
        }
        
        // 2. Verificar se já pagou HOJE
        $paidToday = Earning::where('cycle_id', $cycle->id)
            ->whereDate('created_at', today())
            ->exists();
        
        if ($paidToday) {
            $stats['cycles_skipped_already_paid']++;
            continue;
        }
        
        // 3. Verificar se ainda tem dias para pagar
        $daysPaid = $cycle->days_paid ?? 0;
        $durationDays = $cycle->duration_days;
        
        if ($daysPaid >= $durationDays) {
            // Ciclo completo, finalizar
            $cycle->status = 'FINISHED';
            $cycle->save();
            $stats['cycles_completed']++;
            echo "✅ CICLO #{$cycle->id} FINALIZADO (todos os dias pagos)\n";
            continue;
        }
        
        // 4. PROCESSAR PAGAMENTO
        DB::beginTransaction();
        
        try {
            $dailyIncome = (float) $cycle->daily_income;
            $user = $cycle->user;
            
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            echo "💰 PROCESSANDO CICLO #{$cycle->id}\n";
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            echo "Usuário: {$user->name} (ID: {$user->id})\n";
            echo "Plano: " . ($cycle->plan ? $cycle->plan->name : 'N/A') . "\n";
            echo "Dia atual: " . ($daysPaid + 1) . "/{$durationDays}\n";
            echo "Rendimento: R$ " . number_format($dailyIncome, 2, ',', '.') . "\n";
            echo "\n";
            
            // A) PAGAR RENDIMENTO AO USUÁRIO
            $user->balance_withdrawn += $dailyIncome;
            $user->total_earned += $dailyIncome;
            $user->save();
            
            // B) CRIAR EARNING
            $earning = Earning::create([
                'user_id' => $user->id,
                'cycle_id' => $cycle->id,
                'reference_date' => today(),
                'value' => $dailyIncome,
                'type' => 'DAILY',
            ]);
            
            // C) CRIAR LEDGER DO RENDIMENTO
            Ledger::create([
                'user_id' => $user->id,
                'type' => 'EARNING',
                'reference_type' => Earning::class,
                'reference_id' => $earning->id,
                'description' => sprintf(
                    "Rendimento dia %d do ciclo #%d (%s)",
                    $daysPaid + 1,
                    $cycle->id,
                    $cycle->plan ? $cycle->plan->name : 'N/A'
                ),
                'amount' => $dailyIncome,
                'operation' => 'CREDIT',
                'balance_type' => 'balance_withdrawn',
            ]);
            
            // D) ATUALIZAR CICLO
            $cycle->days_paid = $daysPaid + 1;
            $cycle->total_paid = ($cycle->total_paid ?? 0) + $dailyIncome;
            $cycle->save();
            
            echo "✅ Rendimento pago: R$ " . number_format($dailyIncome, 2, ',', '.') . "\n";
            
            $stats['cycles_processed']++;
            $stats['total_earnings_paid'] += $dailyIncome;
            $stats['users_benefited'][$user->id] = $user->name;
            
            // E) PAGAR RESIDUAIS
            if (!empty($residualTiers)) {
                echo "\n📊 Calculando residuais...\n";
                
                $totalResidualsThisCycle = 0;
                $currentUser = $user;
                
                foreach ($residualTiers as $level => $percent) {
                    // Buscar quem indicou
                    if (!$currentUser->referred_by_id) {
                        break; // Não tem mais indicadores
                    }
                    
                    $referrer = User::find($currentUser->referred_by_id);
                    
                    if (!$referrer) {
                        break;
                    }
                    
                    // Calcular comissão residual
                    $residualAmount = $dailyIncome * ($percent / 100);
                    
                    // Creditar no indicador
                    $referrer->balance_withdrawn += $residualAmount;
                    $referrer->total_earned += $residualAmount;
                    $referrer->save();
                    
                    // Criar ledger
                    Ledger::create([
                        'user_id' => $referrer->id,
                        'type' => 'COMMISSION_RESIDUAL',
                        'reference_type' => Earning::class,
                        'reference_id' => $earning->id,
                        'description' => sprintf(
                            "Comissão residual nível %d sobre rendimento de %s (Ciclo #%d)",
                            $level,
                            $user->name,
                            $cycle->id
                        ),
                        'amount' => $residualAmount,
                        'operation' => 'CREDIT',
                        'balance_type' => 'balance_withdrawn',
                    ]);
                    
                    echo "  • Nível {$level}: {$referrer->name} recebeu R$ " . number_format($residualAmount, 2, ',', '.') . " ({$percent}%)\n";
                    
                    $totalResidualsThisCycle += $residualAmount;
                    $stats['total_residuals_paid'] += $residualAmount;
                    $stats['users_benefited'][$referrer->id] = $referrer->name;
                    
                    // Próximo nível
                    $currentUser = $referrer;
                }
                
                echo "✅ Total em residuais: R$ " . number_format($totalResidualsThisCycle, 2, ',', '.') . "\n";
            }
            
            DB::commit();
            
            echo "\n";
            
        } catch (\Exception $e) {
            DB::rollBack();
            echo "❌ ERRO ao processar ciclo #{$cycle->id}: " . $e->getMessage() . "\n\n";
            Log::error('Erro ao processar pagamento de ciclo', [
                'cycle_id' => $cycle->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            $stats['errors']++;
        }
        
    } catch (\Exception $e) {
        echo "❌ ERRO GERAL no ciclo #{$cycle->id}: " . $e->getMessage() . "\n\n";
        $stats['errors']++;
    }
}

echo "\n";
echo "===========================================\n";
echo "  RESUMO FINAL\n";
echo "===========================================\n";
echo "Ciclos processados: {$stats['cycles_processed']}\n";
echo "Ciclos aguardando 24h: {$stats['cycles_skipped_time']}\n";
echo "Ciclos já pagos hoje: {$stats['cycles_skipped_already_paid']}\n";
echo "Ciclos finalizados: {$stats['cycles_completed']}\n";
echo "Erros: {$stats['errors']}\n";
echo "\n";
echo "💰 Total pago em rendimentos: R$ " . number_format($stats['total_earnings_paid'], 2, ',', '.') . "\n";
echo "💰 Total pago em residuais: R$ " . number_format($stats['total_residuals_paid'], 2, ',', '.') . "\n";
echo "💰 TOTAL GERAL: R$ " . number_format($stats['total_earnings_paid'] + $stats['total_residuals_paid'], 2, ',', '.') . "\n";
echo "\n";
echo "👥 Usuários beneficiados: " . count($stats['users_benefited']) . "\n";
echo "===========================================\n";
echo "Finalizado em: " . now()->format('d/m/Y H:i:s') . "\n";
echo "\n";

if ($stats['errors'] > 0) {
    echo "⚠️  Houve erros durante o processamento. Verifique os logs.\n\n";
    exit(1);
} else {
    echo "✅ Processamento concluído com sucesso!\n\n";
    exit(0);
}

