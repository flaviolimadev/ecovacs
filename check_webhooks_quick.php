<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n=== VERIFICAÇÃO RÁPIDA DE WEBHOOKS ===\n\n";

// 1. Contar por status
echo "📊 WEBHOOKS POR STATUS:\n";
$statusCounts = DB::table('webhook_events')
    ->select('status', DB::raw('COUNT(*) as total'))
    ->groupBy('status')
    ->orderByDesc('total')
    ->get();

foreach ($statusCounts as $row) {
    $emoji = match($row->status) {
        'late_arrival' => '⚠️',
        'processed' => '✅',
        'failed' => '❌',
        'received' => '📥',
        'manual_pending_webhook' => '⏳',
        'manual_webhook_arrived' => '🎯',
        default => '📌'
    };
    echo sprintf("  %s %s: %d\n", $emoji, strtoupper($row->status), $row->total);
}

// 2. Webhooks atrasados
echo "\n⚠️  WEBHOOKS ATRASADOS (late_arrival):\n";
$lateWebhooks = DB::table('webhook_events as we')
    ->leftJoin('deposits as d', 'we.deposit_id', '=', 'd.id')
    ->where('we.status', 'late_arrival')
    ->select('we.id', 'we.deposit_id', 'd.amount', 'd.paid_at', 'we.created_at')
    ->orderByDesc('we.created_at')
    ->limit(10)
    ->get();

if ($lateWebhooks->isEmpty()) {
    echo "  ❌ NENHUM webhook com status 'late_arrival' encontrado!\n";
    echo "  ⚠️  ISSO INDICA QUE O PROBLEMA É REAL, não é visual!\n";
} else {
    foreach ($lateWebhooks as $wh) {
        echo sprintf(
            "  ID %d | Deposit #%d | R$ %.2f | Webhook: %s | Pago em: %s\n",
            $wh->id,
            $wh->deposit_id,
            $wh->amount ?? 0,
            $wh->created_at,
            $wh->paid_at ?? 'N/A'
        );
    }
}

// 3. Webhooks manuais aguardando
echo "\n⏳ WEBHOOKS MANUAIS AGUARDANDO:\n";
$manualPending = DB::table('webhook_events as we')
    ->leftJoin('deposits as d', 'we.deposit_id', '=', 'd.id')
    ->where('we.status', 'manual_pending_webhook')
    ->select('we.id', 'we.deposit_id', 'd.amount', 'we.created_at', 'd.user_id')
    ->orderByDesc('we.created_at')
    ->limit(10)
    ->get();

if ($manualPending->isEmpty()) {
    echo "  ✅ Nenhum pagamento manual aguardando webhook\n";
} else {
    foreach ($manualPending as $wh) {
        $hoursWaiting = now()->diffInHours($wh->created_at);
        echo sprintf(
            "  ID %d | Deposit #%d | User #%d | R$ %.2f | Há %d horas\n",
            $wh->id,
            $wh->deposit_id,
            $wh->user_id ?? 0,
            $wh->amount ?? 0,
            $hoursWaiting
        );
    }
}

// 4. Últimos 10 depósitos PAID
echo "\n💰 ÚLTIMOS 10 DEPÓSITOS PAID:\n";
$recentPaid = DB::table('deposits as d')
    ->where('d.status', 'PAID')
    ->orderByDesc('d.paid_at')
    ->limit(10)
    ->get();

foreach ($recentPaid as $dep) {
    $webhooks = DB::table('webhook_events')
        ->where('deposit_id', $dep->id)
        ->pluck('status')
        ->toArray();
    
    $webhookInfo = empty($webhooks) ? '⚠️  SEM WEBHOOKS!' : implode(', ', $webhooks);
    
    echo sprintf(
        "  Deposit #%d | User #%d | R$ %.2f | Pago: %s\n",
        $dep->id,
        $dep->user_id,
        $dep->amount,
        $dep->paid_at ?? 'N/A'
    );
    echo "    └─ Webhooks: $webhookInfo\n";
}

// 5. Verificar se a migration foi executada
echo "\n🔧 VERIFICAÇÃO DE ESTRUTURA:\n";
$columns = DB::select("SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'webhook_events' 
    AND column_name = 'status'");

if (!empty($columns)) {
    echo "  ✅ Coluna 'status' existe\n";
    
    // Verificar constraint
    $constraint = DB::select("SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'webhook_events'::regclass 
        AND conname LIKE '%status%'");
    
    if (!empty($constraint)) {
        echo "  ✅ Constraint de status existe\n";
        foreach ($constraint as $c) {
            echo "    └─ " . $c->definition . "\n";
        }
    } else {
        echo "  ⚠️  Constraint de status NÃO encontrada\n";
    }
} else {
    echo "  ❌ Coluna 'status' NÃO existe!\n";
}

echo "\n=== FIM DA VERIFICAÇÃO ===\n\n";

// DIAGNÓSTICO FINAL
echo "🎯 DIAGNÓSTICO:\n";
if ($lateWebhooks->isEmpty() && !$manualPending->isEmpty()) {
    echo "  ⚠️  PROBLEMA: Webhooks marcados como 'manual_pending_webhook' mas nenhum 'late_arrival'\n";
    echo "  🔍 CAUSA PROVÁVEL: Webhooks estão chegando mas não estão sendo marcados como atrasados\n";
    echo "  💡 SOLUÇÃO: Verificar lógica no WebhookController::processWebhook()\n";
} elseif ($lateWebhooks->isEmpty() && $manualPending->isEmpty()) {
    echo "  ℹ️  Não há webhooks atrasados no momento\n";
} else {
    echo "  ✅ Sistema funcionando corretamente!\n";
    echo "     - Webhooks atrasados: " . $lateWebhooks->count() . "\n";
    echo "     - Aguardando: " . $manualPending->count() . "\n";
}

echo "\n";

