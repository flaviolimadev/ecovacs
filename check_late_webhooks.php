<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Deposit;
use App\Models\WebhookEvent;
use Illuminate\Support\Facades\DB;

echo "=== Diagnóstico de Webhooks Atrasados ===\n\n";

// 1. Verificar depósitos PAID
$paidDeposits = Deposit::where('status', 'PAID')
    ->orderBy('paid_at', 'desc')
    ->limit(20)
    ->get();

echo "📊 Últimos 20 depósitos PAID:\n";
foreach ($paidDeposits as $deposit) {
    echo sprintf(
        "  ID: %d | User: %d | Amount: R$ %.2f | Paid At: %s\n",
        $deposit->id,
        $deposit->user_id,
        $deposit->amount,
        $deposit->paid_at ? $deposit->paid_at->format('Y-m-d H:i:s') : 'NULL'
    );
    
    // Verificar webhooks deste depósito
    $webhooks = WebhookEvent::where('deposit_id', $deposit->id)->get();
    
    if ($webhooks->isEmpty()) {
        echo "    ⚠️  SEM WEBHOOKS!\n";
    } else {
        foreach ($webhooks as $webhook) {
            echo sprintf(
                "    └─ Webhook ID: %d | Provider: %s | Status: %s | Created: %s\n",
                $webhook->id,
                $webhook->provider,
                $webhook->status,
                $webhook->created_at->format('Y-m-d H:i:s')
            );
        }
    }
    echo "\n";
}

echo "\n=== Estatísticas de Webhooks ===\n\n";

$stats = [
    'received' => WebhookEvent::where('status', 'received')->count(),
    'processed' => WebhookEvent::where('status', 'processed')->count(),
    'failed' => WebhookEvent::where('status', 'failed')->count(),
    'late_arrival' => WebhookEvent::where('status', 'late_arrival')->count(),
    'manual_pending_webhook' => WebhookEvent::where('status', 'manual_pending_webhook')->count(),
    'manual_webhook_arrived' => WebhookEvent::where('status', 'manual_webhook_arrived')->count(),
];

foreach ($stats as $status => $count) {
    echo sprintf("  %s: %d\n", strtoupper($status), $count);
}

echo "\n=== Webhooks com status late_arrival ===\n\n";
$lateWebhooks = WebhookEvent::where('status', 'late_arrival')
    ->with('deposit')
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();

if ($lateWebhooks->isEmpty()) {
    echo "  ❌ Nenhum webhook com status 'late_arrival' encontrado!\n";
} else {
    foreach ($lateWebhooks as $webhook) {
        echo sprintf(
            "  ID: %d | Deposit: %d | Provider: %s | Created: %s\n",
            $webhook->id,
            $webhook->deposit_id,
            $webhook->provider,
            $webhook->created_at->format('Y-m-d H:i:s')
        );
        if ($webhook->deposit) {
            echo sprintf(
                "    └─ Amount: R$ %.2f | Paid At: %s\n",
                $webhook->deposit->amount,
                $webhook->deposit->paid_at ? $webhook->deposit->paid_at->format('Y-m-d H:i:s') : 'NULL'
            );
        }
    }
}

echo "\n=== Webhooks manuais aguardando ===\n\n";
$manualPending = WebhookEvent::where('status', 'manual_pending_webhook')
    ->with('deposit')
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();

if ($manualPending->isEmpty()) {
    echo "  ✅ Nenhum webhook aguardando (todos já chegaram ou não há pagamentos manuais)\n";
} else {
    foreach ($manualPending as $webhook) {
        echo sprintf(
            "  ID: %d | Deposit: %d | Created: %s (há %s)\n",
            $webhook->id,
            $webhook->deposit_id,
            $webhook->created_at->format('Y-m-d H:i:s'),
            $webhook->created_at->diffForHumans()
        );
        if ($webhook->deposit) {
            echo sprintf(
                "    └─ Amount: R$ %.2f | User: %d\n",
                $webhook->deposit->amount,
                $webhook->deposit->user_id
            );
        }
    }
}

echo "\n=== FIM DO DIAGNÓSTICO ===\n";

