<?php

/**
 * Script para verificar se os valores foram creditados corretamente nos ciclos finalizados
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cycle;
use App\Models\Ledger;
use App\Models\User;

echo "\n";
echo "=============================================\n";
echo "  VERIFICAÇÃO DE SALDOS - CICLOS FINALIZADOS\n";
echo "=============================================\n\n";

// Buscar alguns ciclos finalizados recentemente
$finishedCycles = Cycle::where('status', 'FINISHED')
    ->with(['user', 'plan'])
    ->orderBy('updated_at', 'desc')
    ->limit(5)
    ->get();

echo "📊 Verificando 5 ciclos finalizados recentemente:\n\n";

foreach ($finishedCycles as $cycle) {
    $user = $cycle->user;
    
    echo "---------------------------------------------\n";
    echo "Ciclo #{$cycle->id}\n";
    echo "Usuário: {$user->name} ({$user->email})\n";
    echo "Plano: " . ($cycle->plan ? $cycle->plan->name : 'N/A') . "\n";
    echo "Tipo: {$cycle->type}\n";
    echo "Valor investido: R$ " . number_format($cycle->amount, 2, ',', '.') . "\n";
    echo "Retorno esperado: R$ " . number_format($cycle->total_return, 2, ',', '.') . "\n";
    echo "Total pago: R$ " . number_format($cycle->total_paid, 2, ',', '.') . "\n";
    echo "\n";
    
    // Verificar saldo do usuário
    echo "💰 Saldo do usuário:\n";
    echo "   - balance_withdrawn: R$ " . number_format($user->balance_withdrawn, 2, ',', '.') . "\n";
    echo "   - total_earned: R$ " . number_format($user->total_earned, 2, ',', '.') . "\n";
    echo "\n";
    
    // Verificar registros no ledger
    $ledgerEntries = Ledger::where('reference_type', Cycle::class)
        ->where('reference_id', $cycle->id)
        ->orderBy('created_at', 'desc')
        ->get();
    
    if ($ledgerEntries->count() > 0) {
        echo "📝 Registros no ledger ({$ledgerEntries->count()}):\n";
        foreach ($ledgerEntries as $entry) {
            echo "   - {$entry->description}\n";
            echo "     Valor: R$ " . number_format($entry->amount, 2, ',', '.') . "\n";
            echo "     Data: {$entry->created_at}\n";
            if ($entry->balance_before !== null && $entry->balance_after !== null) {
                echo "     Saldo: R$ " . number_format($entry->balance_before, 2, ',', '.') . " → R$ " . number_format($entry->balance_after, 2, ',', '.') . "\n";
            }
        }
    } else {
        echo "⚠️  Nenhum registro encontrado no ledger para este ciclo!\n";
    }
    echo "\n";
}

echo "=============================================\n";
echo "  RESUMO\n";
echo "=============================================\n\n";

$totalFinished = Cycle::where('status', 'FINISHED')->count();
$totalWithLedger = Ledger::where('reference_type', Cycle::class)
    ->where(function($q) {
        $q->where('description', 'like', '%Finalização%')
          ->orWhere('description', 'like', '%finalizado%')
          ->orWhere('description', 'like', '%finaliz%');
    })
    ->distinct('reference_id')
    ->count('reference_id');

echo "Total de ciclos finalizados: {$totalFinished}\n";
echo "Ciclos com registro no ledger: {$totalWithLedger}\n";

if ($totalFinished > $totalWithLedger) {
    echo "⚠️  " . ($totalFinished - $totalWithLedger) . " ciclos finalizados sem registro no ledger!\n";
} else {
    echo "✅ Todos os ciclos finalizados têm registro no ledger!\n";
}

echo "\n";

