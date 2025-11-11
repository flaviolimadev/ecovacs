#!/usr/bin/env php
<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Cycle;
use App\Models\Earning;
use Carbon\Carbon;

$now = Carbon::now();
echo "Hora atual: " . $now->format('d/m/Y H:i:s') . " (Hora: {$now->hour})\n\n";

// Buscar ciclos que começaram ontem às 10h
$yesterday = $now->copy()->subDay();
$cycles10h = Cycle::where('status', 'ACTIVE')
    ->whereDate('started_at', $yesterday->toDateString())
    ->whereRaw('EXTRACT(HOUR FROM started_at) = 10')
    ->with('user')
    ->get();

echo "Ciclos que começaram ONTEM às 10h: " . $cycles10h->count() . "\n";
echo "═══════════════════════════════════════════\n\n";

foreach ($cycles10h as $cycle) {
    echo "CICLO #{$cycle->id}\n";
    echo "  Usuário: {$cycle->user->name}\n";
    echo "  Iniciado: {$cycle->started_at}\n";
    
    // Verificar se tem pagamento
    $lastPayment = Earning::where('cycle_id', $cycle->id)
        ->orderBy('created_at', 'desc')
        ->first();
    
    if ($lastPayment) {
        $lastPaymentTime = Carbon::parse($lastPayment->created_at);
        echo "  Último pagamento: {$lastPaymentTime->format('d/m/Y H:i:s')} (Hora: {$lastPaymentTime->hour})\n";
        echo "  Mesmo dia? " . ($lastPaymentTime->isSameDay($now) ? 'SIM' : 'NÃO') . "\n";
        echo "  Mesma hora? " . ($lastPaymentTime->hour == $now->hour ? 'SIM' : 'NÃO') . "\n";
        
        $daysSince = $lastPaymentTime->diffInDays($now);
        echo "  Dias desde último pag: {$daysSince} dias\n";
        
        if ($lastPaymentTime->isSameDay($now) && $lastPaymentTime->hour == $now->hour) {
            echo "  ❌ PULA: Já pagou na hora {$now->hour} de hoje\n";
        } elseif ($daysSince == 0) {
            echo "  ❌ PULA: Mesmo dia\n";
        } elseif ($daysSince >= 1 && $now->hour >= $lastPaymentTime->hour) {
            echo "  ✅ DEVERIA PAGAR! (Passou {$daysSince} dia(s) e já é a hora {$now->hour})\n";
        } else {
            echo "  ❌ PULA: Passou {$daysSince} dia(s) mas ainda não chegou na hora {$lastPaymentTime->hour} (agora: {$now->hour})\n";
        }
    } else {
        $startedAt = Carbon::parse($cycle->started_at);
        $daysSince = $startedAt->diffInDays($now);
        echo "  Sem pagamentos ainda\n";
        echo "  Dias desde início: {$daysSince} dias\n";
        echo "  Hora início: {$startedAt->hour}h | Hora atual: {$now->hour}h\n";
        
        if ($daysSince == 0) {
            echo "  ❌ PULA: Mesmo dia (precisa de pelo menos 1 dia)\n";
        } elseif ($daysSince >= 1 && $now->hour >= $startedAt->hour) {
            echo "  ✅ DEVERIA PAGAR! (Passou {$daysSince} dia(s) e já é a hora {$now->hour})\n";
        } else {
            echo "  ❌ PULA: Passou {$daysSince} dia(s) mas ainda não chegou na hora {$startedAt->hour} (agora: {$now->hour})\n";
        }
    }
    echo "\n";
}

