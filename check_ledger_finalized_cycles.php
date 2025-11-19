<?php

/**
 * Script para verificar registros no ledger de ciclos finalizados
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Ledger;
use App\Models\Cycle;
use App\Models\User;

echo "\n";
echo "=============================================\n";
echo "  VERIFICAÇÃO DE LEDGER - CICLOS FINALIZADOS\n";
echo "=============================================\n\n";

// Buscar registros do ledger relacionados a ciclos finalizados
$ledgerEntries = Ledger::where('reference_type', Cycle::class)
    ->where('description', 'like', '%finalizado%')
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();

echo "📊 Últimos 10 registros de finalização no ledger:\n\n";

if ($ledgerEntries->count() === 0) {
    echo "⚠️  Nenhum registro encontrado!\n";
    echo "   Isso significa que os ciclos foram finalizados mas não criaram registros no ledger.\n\n";
} else {
    foreach ($ledgerEntries as $entry) {
        $user = User::find($entry->user_id);
        $cycle = Cycle::find($entry->reference_id);
        
        echo "---------------------------------------------\n";
        echo "ID Ledger: #{$entry->id}\n";
        echo "Usuário: " . ($user ? $user->name : 'N/A') . " (ID: {$entry->user_id})\n";
        echo "Ciclo: #" . ($cycle ? $cycle->id : 'N/A') . "\n";
        echo "Descrição: {$entry->description}\n";
        echo "Valor: R$ " . number_format($entry->amount, 2, ',', '.') . "\n";
        echo "Operação: {$entry->operation}\n";
        if ($entry->balance_before !== null) {
            echo "Saldo antes: R$ " . number_format($entry->balance_before, 2, ',', '.') . "\n";
        }
        if ($entry->balance_after !== null) {
            echo "Saldo depois: R$ " . number_format($entry->balance_after, 2, ',', '.') . "\n";
        }
        echo "Data: {$entry->created_at}\n";
        echo "\n";
    }
}

// Verificar se há ciclos finalizados sem registro no ledger
$finishedCycles = Cycle::where('status', 'FINISHED')
    ->limit(5)
    ->get();

// Verificar se cada ciclo tem registro no ledger
$cyclesWithoutLedger = [];
foreach ($finishedCycles as $cycle) {
    $hasLedger = Ledger::where('reference_type', Cycle::class)
        ->where('reference_id', $cycle->id)
        ->where('description', 'like', '%finalizado%')
        ->exists();
    
    if (!$hasLedger) {
        $cyclesWithoutLedger[] = $cycle;
    }
}

if (count($cyclesWithoutLedger) > 0) {
    echo "⚠️  ENCONTRADOS " . count($cyclesWithoutLedger) . " CICLOS FINALIZADOS SEM REGISTRO NO LEDGER:\n\n";
    foreach ($cyclesWithoutLedger as $cycle) {
        $user = $cycle->user;
        echo "  - Ciclo #{$cycle->id} - Usuário: {$user->name} - Plano: " . ($cycle->plan ? $cycle->plan->name : 'N/A') . "\n";
    }
    echo "\n";
} else {
    echo "✅ Todos os ciclos finalizados têm registro no ledger!\n\n";
}

// Verificar registros gerais relacionados a ciclos
echo "📊 Verificando todos os registros do ledger relacionados a ciclos:\n\n";
$allCycleLedger = Ledger::where('reference_type', Cycle::class)
    ->orderBy('created_at', 'desc')
    ->limit(5)
    ->get(['id', 'user_id', 'description', 'amount', 'created_at']);

if ($allCycleLedger->count() > 0) {
    foreach ($allCycleLedger as $entry) {
        echo "  - {$entry->description} | R$ " . number_format($entry->amount, 2, ',', '.') . " | {$entry->created_at}\n";
    }
} else {
    echo "  ⚠️  Nenhum registro encontrado!\n";
}
echo "\n";

echo "\n";

