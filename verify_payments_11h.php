#!/usr/bin/env php
<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Cycle;
use App\Models\Earning;
use App\Models\User;
use Carbon\Carbon;

echo "\n";
echo "═══════════════════════════════════════════\n";
echo "  🔍 VERIFICAÇÃO DE PAGAMENTOS DAS 11H\n";
echo "═══════════════════════════════════════════\n\n";

$now = Carbon::now();
$yesterday = $now->copy()->subDay();

echo "Data/Hora atual: {$now->format('d/m/Y H:i:s')}\n";
echo "Data de ontem: {$yesterday->format('d/m/Y')}\n\n";

// Buscar ciclos que começaram ontem às 11h
$cycles11h = Cycle::where('status', 'ACTIVE')
    ->whereDate('started_at', $yesterday->toDateString())
    ->whereRaw('EXTRACT(HOUR FROM started_at) = 11')
    ->with(['user', 'plan'])
    ->orderBy('id')
    ->get();

if ($cycles11h->isEmpty()) {
    echo "❌ Nenhum ciclo encontrado das 11h de ontem.\n\n";
    exit(0);
}

echo "📊 Total de ciclos iniciados ontem às 11h: {$cycles11h->count()}\n";
echo "═══════════════════════════════════════════\n\n";

$stats = [
    'total' => $cycles11h->count(),
    'pagos' => 0,
    'nao_pagos' => 0,
    'total_rendimentos' => 0,
    'total_residuais' => 0,
];

foreach ($cycles11h as $cycle) {
    echo "🔍 CICLO #{$cycle->id}\n";
    echo "   Usuário: {$cycle->user->name} (ID: {$cycle->user->id})\n";
    echo "   Plano: " . ($cycle->plan ? $cycle->plan->name : 'N/A') . "\n";
    echo "   Iniciado: {$cycle->started_at}\n";
    echo "   Dias pagos: {$cycle->days_paid}/{$cycle->duration_days}\n";
    
    // Verificar se tem earning de hoje
    $todayEarning = Earning::where('cycle_id', $cycle->id)
        ->whereDate('created_at', $now->toDateString())
        ->where('type', 'DAILY')
        ->first();
    
    if ($todayEarning) {
        echo "   ✅ PAGO HOJE: R$ " . number_format($todayEarning->value, 2, ',', '.') . "\n";
        echo "      Pago em: {$todayEarning->created_at}\n";
        
        $stats['pagos']++;
        $stats['total_rendimentos'] += $todayEarning->value;
        
        // Verificar residuais deste earning
        $residuals = \Illuminate\Support\Facades\DB::table('ledger')
            ->where('type', 'RESIDUAL_COMMISSION')
            ->where('reference_type', 'App\Models\Earning')
            ->where('reference_id', $todayEarning->id)
            ->get();
        
        if ($residuals->count() > 0) {
            echo "      💰 Residuais pagos: {$residuals->count()} usuário(s)\n";
            foreach ($residuals as $res) {
                $beneficiary = User::find($res->user_id);
                echo "         • {$beneficiary->name}: R$ " . number_format($res->amount, 2, ',', '.') . "\n";
                $stats['total_residuais'] += $res->amount;
            }
        } else {
            echo "      ⚠️  Nenhum residual encontrado (usuário pode não ter indicador)\n";
        }
    } else {
        echo "   ❌ NÃO FOI PAGO HOJE\n";
        
        // Verificar se tem algum earning anterior
        $lastEarning = Earning::where('cycle_id', $cycle->id)
            ->orderBy('created_at', 'desc')
            ->first();
        
        if ($lastEarning) {
            echo "      Último pagamento: {$lastEarning->created_at}\n";
        } else {
            echo "      Nunca foi pago\n";
        }
        
        $stats['nao_pagos']++;
    }
    
    echo "\n";
}

echo "═══════════════════════════════════════════\n";
echo "  📊 ESTATÍSTICAS FINAIS\n";
echo "═══════════════════════════════════════════\n";
echo "Total de ciclos das 11h: {$stats['total']}\n";
echo "✅ Pagos hoje: {$stats['pagos']}\n";
echo "❌ Não pagos: {$stats['nao_pagos']}\n";
echo "\n";
echo "💰 Total em rendimentos: R$ " . number_format($stats['total_rendimentos'], 2, ',', '.') . "\n";
echo "💰 Total em residuais: R$ " . number_format($stats['total_residuais'], 2, ',', '.') . "\n";
echo "💰 TOTAL GERAL: R$ " . number_format($stats['total_rendimentos'] + $stats['total_residuais'], 2, ',', '.') . "\n";
echo "═══════════════════════════════════════════\n\n";

if ($stats['nao_pagos'] > 0) {
    echo "⚠️  ATENÇÃO: {$stats['nao_pagos']} ciclo(s) das 11h NÃO foram pagos hoje!\n";
    echo "💡 Para pagar agora, execute: php process_daily_payments.php 11\n\n";
} else {
    echo "✅ Todos os ciclos das 11h foram pagos corretamente!\n\n";
}

