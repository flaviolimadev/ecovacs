<?php

/**
 * Script de Análise de Ciclos Finalizados
 * 
 * Analisa todos os ciclos contratados que já deveriam estar finalizados
 * de acordo com a quantidade de dias (duration_days) e data de término (ends_at)
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cycle;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "\n";
echo "=============================================\n";
echo "  ANÁLISE DE CICLOS FINALIZADOS\n";
echo "=============================================\n\n";

$now = Carbon::now();

// 1. Buscar todos os ciclos
$allCycles = Cycle::with(['user', 'plan'])->get();

echo "📊 Total de ciclos no sistema: " . $allCycles->count() . "\n\n";

// 2. Separar por status
$activeCycles = $allCycles->where('status', 'ACTIVE');
$finishedCycles = $allCycles->where('status', 'FINISHED');
$cancelledCycles = $allCycles->where('status', 'CANCELLED');

echo "📈 Status dos ciclos:\n";
echo "   - ATIVOS: " . $activeCycles->count() . "\n";
echo "   - FINALIZADOS: " . $finishedCycles->count() . "\n";
echo "   - CANCELADOS: " . $cancelledCycles->count() . "\n\n";

// 3. Analisar ciclos que DEVERIAM estar finalizados
echo "=============================================\n";
echo "  CICLOS QUE DEVERIAM ESTAR FINALIZADOS\n";
echo "=============================================\n\n";

$shouldBeFinished = [];
$issues = [];

foreach ($allCycles as $cycle) {
    $shouldFinish = false;
    $reason = [];
    
    // Verificar por data de término
    if ($cycle->ends_at && Carbon::parse($cycle->ends_at)->lt($now)) {
        $shouldFinish = true;
        $daysOverdue = Carbon::parse($cycle->ends_at)->diffInDays($now);
        $reason[] = "Data de término passou há {$daysOverdue} dia(s)";
    }
    
    // Verificar por dias pagos
    if ($cycle->days_paid >= $cycle->duration_days) {
        $shouldFinish = true;
        $reason[] = "Todos os dias foram pagos ({$cycle->days_paid}/{$cycle->duration_days})";
    }
    
    if ($shouldFinish && $cycle->status !== 'FINISHED') {
        $shouldBeFinished[] = [
            'cycle' => $cycle,
            'reasons' => $reason,
        ];
    }
    
    // Verificar inconsistências em ciclos já finalizados
    if ($cycle->status === 'FINISHED') {
        $inconsistencies = [];
        
        // Verificar se days_paid < duration_days
        if ($cycle->days_paid < $cycle->duration_days) {
            $inconsistencies[] = "Finalizado mas faltam " . ($cycle->duration_days - $cycle->days_paid) . " dias para pagar";
        }
        
        // Verificar se ends_at ainda não chegou (com margem de 1 dia para evitar falsos positivos)
        if ($cycle->ends_at) {
            $endsAt = Carbon::parse($cycle->ends_at);
            $daysDiff = $now->diffInDays($endsAt, false); // false = não absoluto, negativo se passou
            
            // Só considerar inconsistência se faltar mais de 1 dia
            if ($daysDiff > 1) {
                $inconsistencies[] = "Finalizado mas ainda faltam {$daysDiff} dia(s) até a data de término";
            }
        }
        
        if (!empty($inconsistencies)) {
            $issues[] = [
                'cycle' => $cycle,
                'inconsistencies' => $inconsistencies,
            ];
        }
    }
}

// 4. Mostrar ciclos que deveriam estar finalizados
if (count($shouldBeFinished) > 0) {
    echo "⚠️  ENCONTRADOS " . count($shouldBeFinished) . " CICLOS QUE DEVERIAM ESTAR FINALIZADOS:\n\n";
    
    foreach ($shouldBeFinished as $item) {
        $cycle = $item['cycle'];
        $user = $cycle->user;
        $plan = $cycle->plan;
        
        echo "---------------------------------------------\n";
        echo "Ciclo #{$cycle->id}\n";
        echo "Usuário: {$user->name} ({$user->email})\n";
        echo "Plano: " . ($plan ? $plan->name : 'N/A') . "\n";
        echo "Tipo: {$cycle->type}\n";
        echo "Valor investido: R$ " . number_format($cycle->amount, 2, ',', '.') . "\n";
        echo "Duração: {$cycle->duration_days} dias\n";
        echo "Dias pagos: {$cycle->days_paid}/{$cycle->duration_days}\n";
        echo "Status atual: {$cycle->status}\n";
        echo "Iniciado em: " . Carbon::parse($cycle->started_at)->format('d/m/Y H:i:s') . "\n";
        echo "Termina em: " . ($cycle->ends_at ? Carbon::parse($cycle->ends_at)->format('d/m/Y H:i:s') : 'N/A') . "\n";
        echo "Motivos para finalizar:\n";
        foreach ($item['reasons'] as $r) {
            echo "  - {$r}\n";
        }
        echo "\n";
    }
} else {
    echo "✅ Nenhum ciclo encontrado que deveria estar finalizado!\n\n";
}

// 5. Mostrar inconsistências em ciclos finalizados
if (count($issues) > 0) {
    echo "=============================================\n";
    echo "  INCONSISTÊNCIAS EM CICLOS FINALIZADOS\n";
    echo "=============================================\n\n";
    
    echo "⚠️  ENCONTRADOS " . count($issues) . " CICLOS FINALIZADOS COM INCONSISTÊNCIAS:\n\n";
    
    foreach ($issues as $item) {
        $cycle = $item['cycle'];
        $user = $cycle->user;
        $plan = $cycle->plan;
        
        echo "---------------------------------------------\n";
        echo "Ciclo #{$cycle->id}\n";
        echo "Usuário: {$user->name} ({$user->email})\n";
        echo "Plano: " . ($plan ? $plan->name : 'N/A') . "\n";
        echo "Duração: {$cycle->duration_days} dias\n";
        echo "Dias pagos: {$cycle->days_paid}/{$cycle->duration_days}\n";
        echo "Inconsistências:\n";
        foreach ($item['inconsistencies'] as $inc) {
            echo "  - {$inc}\n";
        }
        echo "\n";
    }
} else {
    echo "✅ Nenhuma inconsistência encontrada em ciclos finalizados!\n\n";
}

// 6. Estatísticas detalhadas dos ciclos finalizados
echo "=============================================\n";
echo "  ESTATÍSTICAS DOS CICLOS FINALIZADOS\n";
echo "=============================================\n\n";

if ($finishedCycles->count() > 0) {
    $totalInvested = $finishedCycles->sum('amount');
    $totalPaid = $finishedCycles->sum('total_paid');
    $totalExpectedReturn = $finishedCycles->sum('total_return');
    
    $byType = $finishedCycles->groupBy('type');
    $byPlan = $finishedCycles->groupBy('plan_id');
    
    echo "💰 Valores:\n";
    echo "   - Total investido: R$ " . number_format($totalInvested, 2, ',', '.') . "\n";
    echo "   - Total pago: R$ " . number_format($totalPaid, 2, ',', '.') . "\n";
    echo "   - Retorno esperado: R$ " . number_format($totalExpectedReturn, 2, ',', '.') . "\n";
    echo "   - Diferença: R$ " . number_format($totalExpectedReturn - $totalPaid, 2, ',', '.') . "\n\n";
    
    echo "📊 Por tipo:\n";
    foreach ($byType as $type => $cycles) {
        echo "   - {$type}: " . $cycles->count() . " ciclos\n";
    }
    echo "\n";
    
    echo "📋 Por plano (top 10):\n";
    $planStats = [];
    foreach ($byPlan as $planId => $cycles) {
        $plan = Plan::find($planId);
        $planStats[] = [
            'plan' => $plan ? $plan->name : "Plano #{$planId}",
            'count' => $cycles->count(),
            'total_invested' => $cycles->sum('amount'),
        ];
    }
    usort($planStats, fn($a, $b) => $b['count'] - $a['count']);
    foreach (array_slice($planStats, 0, 10) as $stat) {
        echo "   - {$stat['plan']}: {$stat['count']} ciclos (R$ " . number_format($stat['total_invested'], 2, ',', '.') . ")\n";
    }
    echo "\n";
    
    // Análise de dias pagos vs duração
    echo "📈 Análise de dias pagos:\n";
    $perfectFinishes = $finishedCycles->filter(fn($c) => $c->days_paid == $c->duration_days)->count();
    $incompleteFinishes = $finishedCycles->filter(fn($c) => $c->days_paid < $c->duration_days)->count();
    $overpaidFinishes = $finishedCycles->filter(fn($c) => $c->days_paid > $c->duration_days)->count();
    
    echo "   - Finalizados com todos os dias pagos: {$perfectFinishes}\n";
    echo "   - Finalizados com dias faltando: {$incompleteFinishes}\n";
    echo "   - Finalizados com dias a mais: {$overpaidFinishes}\n";
    echo "\n";
} else {
    echo "ℹ️  Nenhum ciclo finalizado encontrado.\n\n";
}

// 7. Resumo final
echo "=============================================\n";
echo "  RESUMO FINAL\n";
echo "=============================================\n\n";

echo "✅ Ciclos corretamente finalizados: " . ($finishedCycles->count() - count($issues)) . "\n";
echo "⚠️  Ciclos que deveriam estar finalizados: " . count($shouldBeFinished) . "\n";
echo "⚠️  Ciclos finalizados com inconsistências: " . count($issues) . "\n";
echo "\n";

if (count($shouldBeFinished) > 0 || count($issues) > 0) {
    echo "💡 RECOMENDAÇÃO: Execute o script de finalização de ciclos para corrigir os problemas encontrados.\n";
}

echo "\n";

