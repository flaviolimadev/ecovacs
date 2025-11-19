<?php

/**
 * Script para verificar ciclos pendentes que ainda não foram creditados
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cycle;
use App\Models\Ledger;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "\n";
echo "=============================================\n";
echo "  VERIFICAÇÃO DE CICLOS PENDENTES\n";
echo "=============================================\n\n";

$now = Carbon::now();
$pendingCycles = [];
$totalPending = 0;

// 1. Buscar ciclos ativos que já completaram todos os dias
$cyclesCompleted = Cycle::where('status', 'ACTIVE')
    ->whereRaw('days_paid >= duration_days')
    ->with(['user', 'plan'])
    ->get();

echo "📊 CICLOS ATIVOS QUE COMPLETARAM TODOS OS DIAS:\n";
echo "   Encontrados: " . $cyclesCompleted->count() . "\n\n";

foreach ($cyclesCompleted as $cycle) {
    $user = $cycle->user;
    $plan = $cycle->plan;
    
    $pendingAmount = 0;
    $reason = [];
    
    if ($cycle->type === 'END_CYCLE') {
        // Verificar se o retorno total foi pago
        if ($cycle->total_paid < $cycle->total_return) {
            $pendingAmount = $cycle->total_return - $cycle->total_paid;
            $reason[] = "Retorno total não foi creditado (falta R$ " . number_format($pendingAmount, 2, ',', '.') . ")";
        }
    } else {
        // Ciclo DAILY: verificar se todos os dias foram pagos
        $expectedTotal = $cycle->daily_income * $cycle->duration_days;
        if ($cycle->total_paid < $expectedTotal) {
            $pendingAmount = $expectedTotal - $cycle->total_paid;
            $reason[] = "Ajuste de rendimentos pendente (falta R$ " . number_format($pendingAmount, 2, ',', '.') . ")";
        }
    }
    
    if ($pendingAmount > 0 || $cycle->days_paid >= $cycle->duration_days) {
        $pendingCycles[] = [
            'cycle' => $cycle,
            'pending_amount' => $pendingAmount,
            'reason' => $reason,
            'type' => 'completed_days',
        ];
        $totalPending += $pendingAmount;
    }
}

// 2. Buscar ciclos ativos que já passaram da data de término
$cyclesExpired = Cycle::where('status', 'ACTIVE')
    ->whereNotNull('ends_at')
    ->where('ends_at', '<', $now)
    ->with(['user', 'plan'])
    ->get();

echo "📊 CICLOS ATIVOS QUE PASSARAM DA DATA DE TÉRMINO:\n";
echo "   Encontrados: " . $cyclesExpired->count() . "\n\n";

foreach ($cyclesExpired as $cycle) {
    // Verificar se já está na lista de completados
    $alreadyListed = false;
    foreach ($pendingCycles as $item) {
        if ($item['cycle']->id === $cycle->id) {
            $alreadyListed = true;
            break;
        }
    }
    
    if (!$alreadyListed) {
        $pendingAmount = 0;
        $reason = [];
        
        if ($cycle->type === 'END_CYCLE') {
            if ($cycle->total_paid < $cycle->total_return) {
                $pendingAmount = $cycle->total_return - $cycle->total_paid;
                $reason[] = "Data de término passou e retorno total não foi creditado";
            }
        } else {
            $expectedTotal = $cycle->daily_income * $cycle->duration_days;
            if ($cycle->total_paid < $expectedTotal) {
                $pendingAmount = $expectedTotal - $cycle->total_paid;
                $reason[] = "Data de término passou e há rendimentos pendentes";
            }
        }
        
        if ($pendingAmount > 0 || $cycle->days_paid < $cycle->duration_days) {
            $pendingCycles[] = [
                'cycle' => $cycle,
                'pending_amount' => $pendingAmount,
                'reason' => $reason,
                'type' => 'expired',
            ];
            $totalPending += $pendingAmount;
        }
    }
}

// 3. Buscar ciclos finalizados que não receberam crédito
$finishedWithoutCredit = Cycle::where('status', 'FINISHED')
    ->with(['user', 'plan'])
    ->get();

echo "📊 CICLOS FINALIZADOS - VERIFICANDO CRÉDITOS:\n\n";

$finishedPending = [];
foreach ($finishedWithoutCredit as $cycle) {
    // Verificar se há registro no ledger de finalização
    $hasFinalizationLedger = Ledger::where('reference_type', Cycle::class)
        ->where('reference_id', $cycle->id)
        ->where(function($q) {
            $q->where('description', 'like', '%Finalização%')
              ->orWhere('description', 'like', '%finalizado%')
              ->orWhere('description', 'like', '%finaliz%');
        })
        ->exists();
    
    // Verificar se o valor foi creditado
    $expectedCredit = 0;
    if ($cycle->type === 'END_CYCLE') {
        $expectedCredit = $cycle->total_return;
    } else {
        $expectedCredit = $cycle->daily_income * $cycle->duration_days;
    }
    
    // Verificar se o total_paid está correto
    if ($cycle->total_paid < $expectedCredit) {
        $missing = $expectedCredit - $cycle->total_paid;
        $finishedPending[] = [
            'cycle' => $cycle,
            'missing_amount' => $missing,
            'has_ledger' => $hasFinalizationLedger,
        ];
        $totalPending += $missing;
    }
}

// 4. Mostrar resultados
if (count($pendingCycles) > 0 || count($finishedPending) > 0) {
    echo "⚠️  ENCONTRADOS CICLOS PENDENTES:\n\n";
    
    if (count($pendingCycles) > 0) {
        echo "=============================================\n";
        echo "  CICLOS ATIVOS PENDENTES\n";
        echo "=============================================\n\n";
        
        foreach ($pendingCycles as $item) {
            $cycle = $item['cycle'];
            $user = $cycle->user;
            $plan = $cycle->plan;
            
            echo "---------------------------------------------\n";
            echo "Ciclo #{$cycle->id}\n";
            echo "Usuário: {$user->name} ({$user->email})\n";
            echo "Plano: " . ($plan ? $plan->name : 'N/A') . "\n";
            echo "Tipo: {$cycle->type}\n";
            echo "Status: {$cycle->status}\n";
            echo "Duração: {$cycle->duration_days} dias\n";
            echo "Dias pagos: {$cycle->days_paid}/{$cycle->duration_days}\n";
            echo "Valor investido: R$ " . number_format($cycle->amount, 2, ',', '.') . "\n";
            echo "Total pago: R$ " . number_format($cycle->total_paid, 2, ',', '.') . "\n";
            if ($cycle->type === 'END_CYCLE') {
                echo "Retorno esperado: R$ " . number_format($cycle->total_return, 2, ',', '.') . "\n";
            } else {
                $expected = $cycle->daily_income * $cycle->duration_days;
                echo "Retorno esperado: R$ " . number_format($expected, 2, ',', '.') . "\n";
            }
            if ($item['pending_amount'] > 0) {
                echo "💰 VALOR PENDENTE: R$ " . number_format($item['pending_amount'], 2, ',', '.') . "\n";
            }
            if (!empty($item['reason'])) {
                echo "Motivos:\n";
                foreach ($item['reason'] as $r) {
                    echo "  - {$r}\n";
                }
            }
            echo "Iniciado em: " . Carbon::parse($cycle->started_at)->format('d/m/Y H:i:s') . "\n";
            if ($cycle->ends_at) {
                $endsAt = Carbon::parse($cycle->ends_at);
                $daysDiff = $now->diffInDays($endsAt, false);
                echo "Termina em: " . $endsAt->format('d/m/Y H:i:s');
                if ($daysDiff < 0) {
                    echo " (passou há " . abs($daysDiff) . " dia(s))";
                }
                echo "\n";
            }
            echo "\n";
        }
    }
    
    if (count($finishedPending) > 0) {
        echo "=============================================\n";
        echo "  CICLOS FINALIZADOS COM CRÉDITOS PENDENTES\n";
        echo "=============================================\n\n";
        
        foreach ($finishedPending as $item) {
            $cycle = $item['cycle'];
            $user = $cycle->user;
            $plan = $cycle->plan;
            
            echo "---------------------------------------------\n";
            echo "Ciclo #{$cycle->id}\n";
            echo "Usuário: {$user->name} ({$user->email})\n";
            echo "Plano: " . ($plan ? $plan->name : 'N/A') . "\n";
            echo "💰 VALOR FALTANDO: R$ " . number_format($item['missing_amount'], 2, ',', '.') . "\n";
            echo "Tem registro no ledger: " . ($item['has_ledger'] ? 'SIM' : 'NÃO') . "\n";
            echo "\n";
        }
    }
    
    echo "=============================================\n";
    echo "  RESUMO\n";
    echo "=============================================\n\n";
    
    echo "Total de ciclos ativos pendentes: " . count($pendingCycles) . "\n";
    echo "Total de ciclos finalizados com créditos pendentes: " . count($finishedPending) . "\n";
    echo "💰 VALOR TOTAL PENDENTE: R$ " . number_format($totalPending, 2, ',', '.') . "\n";
    echo "\n";
    
    if ($totalPending > 0) {
        echo "💡 RECOMENDAÇÃO: Execute o script de finalização para creditar os valores:\n";
        echo "   php finalize_completed_cycles.php\n";
    }
    
} else {
    echo "✅ Nenhum ciclo pendente encontrado!\n";
    echo "   Todos os ciclos estão com os créditos corretos.\n\n";
}

echo "\n";

