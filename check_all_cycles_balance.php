<?php

/**
 * Script para verificar TODOS os ciclos e identificar valores pendentes
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cycle;
use App\Models\Ledger;
use App\Models\User;
use Carbon\Carbon;

// Configurar timezone do Brasil
date_default_timezone_set(config('app.timezone'));
Carbon::setLocale('pt_BR');

echo "\n";
echo "=============================================\n";
echo "  VERIFICAÇÃO COMPLETA DE CICLOS\n";
echo "=============================================\n\n";

$now = Carbon::now(config('app.timezone'));
$issues = [];
$totalMissing = 0;

// Buscar TODOS os ciclos
$allCycles = Cycle::with(['user', 'plan'])->get();

echo "📊 Total de ciclos no sistema: " . $allCycles->count() . "\n\n";

foreach ($allCycles as $cycle) {
    $user = $cycle->user;
    $plan = $cycle->plan;
    
    $expectedTotal = 0;
    $missingAmount = 0;
    $issuesFound = [];
    
    // Calcular valor esperado
    if ($cycle->type === 'END_CYCLE') {
        $expectedTotal = $cycle->total_return;
        
        // Para END_CYCLE, só verificar se já completou ou passou da data
        if ($cycle->status === 'ACTIVE') {
            // Se já completou todos os dias OU passou da data, deveria ter recebido
            if ($cycle->days_paid >= $cycle->duration_days || 
                ($cycle->ends_at && Carbon::parse($cycle->ends_at)->setTimezone(config('app.timezone'))->lt($now))) {
                if ($cycle->total_paid < $expectedTotal) {
                    $missingAmount = $expectedTotal - $cycle->total_paid;
                    $issuesFound[] = "Falta creditar retorno final: R$ " . number_format($missingAmount, 2, ',', '.');
                }
            }
        } else if ($cycle->status === 'FINISHED') {
            // Se finalizado, verificar se recebeu tudo
            if ($cycle->total_paid < $expectedTotal) {
                $missingAmount = $expectedTotal - $cycle->total_paid;
                $issuesFound[] = "Ciclo finalizado mas falta creditar: R$ " . number_format($missingAmount, 2, ',', '.');
            }
        }
    } else {
        // Ciclo DAILY: só verificar se já completou todos os dias
        $expectedTotal = ($cycle->daily_income ?? 0) * $cycle->duration_days;
        
        if ($cycle->status === 'ACTIVE' && $cycle->days_paid >= $cycle->duration_days) {
            // Já completou todos os dias, verificar se recebeu tudo
            if ($cycle->total_paid < $expectedTotal) {
                $missingAmount = $expectedTotal - $cycle->total_paid;
                $issuesFound[] = "Ciclo completou todos os dias mas falta creditar: R$ " . number_format($missingAmount, 2, ',', '.');
            }
        } else if ($cycle->status === 'FINISHED') {
            // Se finalizado, verificar se recebeu tudo
            if ($cycle->total_paid < $expectedTotal) {
                $missingAmount = $expectedTotal - $cycle->total_paid;
                $issuesFound[] = "Ciclo finalizado mas falta creditar: R$ " . number_format($missingAmount, 2, ',', '.');
            }
        }
        // Se ciclo DAILY ainda está em andamento (days_paid < duration_days), não é problema!
    }
    
    // Verificar se ciclo ativo já completou mas não foi finalizado
    if ($cycle->status === 'ACTIVE') {
        if ($cycle->days_paid >= $cycle->duration_days) {
            $issuesFound[] = "Ciclo completou todos os dias mas ainda está ATIVO";
        }
        
        if ($cycle->ends_at && Carbon::parse($cycle->ends_at)->setTimezone(config('app.timezone'))->lt($now)) {
            $daysOverdue = Carbon::parse($cycle->ends_at)->setTimezone(config('app.timezone'))->diffInDays($now);
            $issuesFound[] = "Data de término passou há {$daysOverdue} dia(s) mas ainda está ATIVO";
        }
    }
    
    // Verificar se há registro no ledger para finalização (se finalizado)
    if ($cycle->status === 'FINISHED') {
        $hasFinalizationLedger = Ledger::where('reference_type', Cycle::class)
            ->where('reference_id', $cycle->id)
            ->where(function($q) {
                $q->where('description', 'like', '%Finalização%')
                  ->orWhere('description', 'like', '%finalizado%')
                  ->orWhere('description', 'like', '%finaliz%');
            })
            ->exists();
        
        if (!$hasFinalizationLedger && $cycle->type === 'END_CYCLE' && $cycle->total_return > 0) {
            $issuesFound[] = "Ciclo finalizado mas sem registro no ledger de finalização";
        }
    }
    
    // Se encontrou problemas, adicionar à lista
    if (!empty($issuesFound) || $missingAmount > 0) {
        $issues[] = [
            'cycle' => $cycle,
            'issues' => $issuesFound,
            'missing_amount' => $missingAmount,
        ];
        $totalMissing += $missingAmount;
    }
}

// Mostrar resultados
if (count($issues) > 0) {
    echo "⚠️  ENCONTRADOS " . count($issues) . " CICLOS COM PROBLEMAS:\n\n";
    
    foreach ($issues as $item) {
        $cycle = $item['cycle'];
        $user = $cycle->user;
        $plan = $cycle->plan;
        
        echo "---------------------------------------------\n";
        echo "Ciclo #{$cycle->id}\n";
        echo "Usuário: {$user->name} ({$user->email})\n";
        echo "Plano: " . ($plan ? $plan->name : 'N/A') . "\n";
        echo "Tipo: {$cycle->type}\n";
        echo "Status: {$cycle->status}\n";
        echo "Duração: {$cycle->duration_days} dias | Dias pagos: {$cycle->days_paid}\n";
        echo "Valor investido: R$ " . number_format($cycle->amount, 2, ',', '.') . "\n";
        echo "Total pago: R$ " . number_format($cycle->total_paid, 2, ',', '.') . "\n";
        
        if ($cycle->type === 'END_CYCLE') {
            echo "Retorno esperado: R$ " . number_format($cycle->total_return, 2, ',', '.') . "\n";
        } else {
            $expected = ($cycle->daily_income ?? 0) * $cycle->duration_days;
            echo "Retorno esperado: R$ " . number_format($expected, 2, ',', '.') . "\n";
        }
        
        if ($item['missing_amount'] > 0) {
            echo "💰 VALOR PENDENTE: R$ " . number_format($item['missing_amount'], 2, ',', '.') . "\n";
        }
        
        if (!empty($item['issues'])) {
            echo "Problemas encontrados:\n";
            foreach ($item['issues'] as $issue) {
                echo "  ⚠️  {$issue}\n";
            }
        }
        echo "\n";
    }
    
    echo "=============================================\n";
    echo "  RESUMO\n";
    echo "=============================================\n\n";
    
    echo "Total de ciclos com problemas: " . count($issues) . "\n";
    echo "💰 VALOR TOTAL PENDENTE: R$ " . number_format($totalMissing, 2, ',', '.') . "\n";
    echo "\n";
    
    if ($totalMissing > 0) {
        echo "💡 RECOMENDAÇÃO: Execute o script de finalização:\n";
        echo "   php finalize_completed_cycles.php\n";
    }
    
} else {
    echo "✅ NENHUM PROBLEMA ENCONTRADO!\n\n";
    echo "Todos os ciclos estão:\n";
    echo "  ✅ Com valores corretos creditados\n";
    echo "  ✅ Com status correto (ATIVO/FINALIZADO)\n";
    echo "  ✅ Com registros no ledger quando necessário\n";
    echo "\n";
}

// Estatísticas gerais
echo "=============================================\n";
echo "  ESTATÍSTICAS GERAIS\n";
echo "=============================================\n\n";

$activeCycles = $allCycles->where('status', 'ACTIVE')->count();
$finishedCycles = $allCycles->where('status', 'FINISHED')->count();
$cancelledCycles = $allCycles->where('status', 'CANCELLED')->count();

$totalInvested = $allCycles->sum('amount');
$totalPaid = $allCycles->sum('total_paid');

echo "Status dos ciclos:\n";
echo "  - ATIVOS: {$activeCycles}\n";
echo "  - FINALIZADOS: {$finishedCycles}\n";
echo "  - CANCELADOS: {$cancelledCycles}\n";
echo "\n";

echo "Valores:\n";
echo "  - Total investido: R$ " . number_format($totalInvested, 2, ',', '.') . "\n";
echo "  - Total pago: R$ " . number_format($totalPaid, 2, ',', '.') . "\n";
echo "\n";

echo "\n";

