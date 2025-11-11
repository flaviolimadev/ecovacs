#!/usr/bin/env php
<?php

/**
 * Script para verificar ciclos com mais de 24h e calcular pagamentos pendentes
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Cycle;
use App\Models\User;
use Carbon\Carbon;

echo "\n";
echo "===========================================\n";
echo "  VERIFICAÇÃO DE CICLOS E PAGAMENTOS\n";
echo "===========================================\n";
echo "\n";

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

$totalPending = 0;
$cyclesWithIssues = 0;

foreach ($cycles as $cycle) {
    $now = Carbon::now();
    $startedAt = Carbon::parse($cycle->started_at);
    $hoursElapsed = $startedAt->diffInHours($now);
    
    // Só mostrar ciclos com mais de 24h
    if ($hoursElapsed < 24) {
        continue;
    }
    
    $daysElapsed = floor($hoursElapsed / 24);
    $daysPaid = $cycle->days_paid ?? 0;
    $dailyIncome = (float) $cycle->daily_income;
    $durationDays = $cycle->duration_days;
    
    // Calcular quantos dias deveriam ter sido pagos
    $daysShouldBePaid = min($daysElapsed, $durationDays);
    
    // Calcular quantos dias estão pendentes
    $daysPending = $daysShouldBePaid - $daysPaid;
    
    if ($daysPending > 0) {
        $cyclesWithIssues++;
        $amountPending = $daysPending * $dailyIncome;
        $totalPending += $amountPending;
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "🔴 CICLO #{$cycle->id} - PAGAMENTO PENDENTE\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "Usuário: {$cycle->user->name} (ID: {$cycle->user_id})\n";
        echo "Email: {$cycle->user->email}\n";
        echo "Plano: " . ($cycle->plan ? $cycle->plan->name : 'N/A') . "\n";
        echo "Valor Investido: R$ " . number_format($cycle->amount, 2, ',', '.') . "\n";
        echo "Rendimento Diário: R$ " . number_format($dailyIncome, 2, ',', '.') . "\n";
        echo "\n";
        echo "📅 Tempo:\n";
        echo "  - Iniciado em: " . $startedAt->format('d/m/Y H:i:s') . "\n";
        echo "  - Horas decorridas: {$hoursElapsed}h\n";
        echo "  - Dias decorridos: {$daysElapsed} dias\n";
        echo "  - Duração total: {$durationDays} dias\n";
        echo "\n";
        echo "💰 Pagamentos:\n";
        echo "  - Dias que deveriam estar pagos: {$daysShouldBePaid}\n";
        echo "  - Dias efetivamente pagos: {$daysPaid}\n";
        echo "  - Dias pendentes: {$daysPending}\n";
        echo "  - Valor já pago: R$ " . number_format($cycle->total_paid ?? 0, 2, ',', '.') . "\n";
        echo "  - 🚨 VALOR PENDENTE: R$ " . number_format($amountPending, 2, ',', '.') . "\n";
        echo "\n";
        
    } else {
        // Ciclo OK
        echo "✅ CICLO #{$cycle->id} - OK\n";
        echo "   Usuário: {$cycle->user->name}\n";
        echo "   Dias pagos: {$daysPaid}/{$daysShouldBePaid}\n";
        echo "   Iniciado há: {$daysElapsed} dias\n";
        echo "\n";
    }
}

echo "\n";
echo "===========================================\n";
echo "  RESUMO GERAL\n";
echo "===========================================\n";
echo "Total de ciclos ATIVOS: " . $cycles->count() . "\n";
echo "Ciclos com mais de 24h: " . $cycles->filter(function($c) {
    return Carbon::parse($c->started_at)->diffInHours(Carbon::now()) >= 24;
})->count() . "\n";
echo "Ciclos com pagamento PENDENTE: {$cyclesWithIssues}\n";
echo "💰 TOTAL PENDENTE: R$ " . number_format($totalPending, 2, ',', '.') . "\n";
echo "===========================================\n";
echo "\n";

if ($cyclesWithIssues > 0) {
    echo "⚠️  ATENÇÃO: Existem ciclos com pagamentos atrasados!\n";
    echo "    Execute o comando de pagamento de ciclos para regularizar.\n";
    echo "\n";
    exit(1);
} else {
    echo "✅ Todos os ciclos estão em dia!\n";
    echo "\n";
    exit(0);
}

