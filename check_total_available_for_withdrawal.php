<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;

echo "=============================================\n";
echo "  TOTAL DISPONÍVEL PARA SAQUE\n";
echo "=============================================\n\n";

// Total disponível para saque (soma de balance_withdrawn de todos os usuários)
$totalAvailable = User::sum('balance_withdrawn');

// Saques pendentes (REQUESTED + APPROVED)
$pendingWithdrawals = Withdrawal::whereIn('status', ['REQUESTED', 'APPROVED'])->sum('amount');

// Saques já pagos
$paidWithdrawals = Withdrawal::where('status', 'PAID')->sum('amount');

// Total de saques solicitados (todos os status)
$totalRequested = Withdrawal::sum('amount');

// Saldo líquido disponível (disponível - pendentes)
$liquidAvailable = $totalAvailable - $pendingWithdrawals;

// Estatísticas por status
$byStatus = Withdrawal::select('status', DB::raw('count(*) as count'), DB::raw('sum(amount) as total'))
    ->groupBy('status')
    ->get();

echo "💰 SALDO DISPONÍVEL PARA SAQUE\n";
echo "-------------------------------------------\n";
echo "Total disponível (balance_withdrawn): R$ " . number_format($totalAvailable, 2, ',', '.') . "\n";
echo "Saques pendentes (REQUESTED + APPROVED): R$ " . number_format($pendingWithdrawals, 2, ',', '.') . "\n";
echo "Saldo líquido disponível: R$ " . number_format($liquidAvailable, 2, ',', '.') . "\n\n";

echo "📊 SAQUES\n";
echo "-------------------------------------------\n";
echo "Total de saques pagos: R$ " . number_format($paidWithdrawals, 2, ',', '.') . "\n";
echo "Total solicitado (todos os status): R$ " . number_format($totalRequested, 2, ',', '.') . "\n\n";

echo "📈 SAQUES POR STATUS\n";
echo "-------------------------------------------\n";
foreach ($byStatus as $status) {
    echo sprintf(
        "%-15s: %5d saques | Total: R$ %s\n",
        $status->status,
        $status->count,
        number_format($status->total, 2, ',', '.')
    );
}

echo "\n";

// Verificar inconsistências
$usersWithNegative = User::where('balance_withdrawn', '<', 0)->count();
if ($usersWithNegative > 0) {
    echo "⚠️  ATENÇÃO: {$usersWithNegative} usuário(s) com saldo negativo para saque!\n\n";
}

// Top 10 usuários com maior saldo disponível
echo "👥 TOP 10 USUÁRIOS COM MAIOR SALDO DISPONÍVEL\n";
echo "-------------------------------------------\n";
$topUsers = User::orderBy('balance_withdrawn', 'desc')
    ->limit(10)
    ->get(['id', 'name', 'email', 'balance_withdrawn']);

foreach ($topUsers as $index => $user) {
    echo sprintf(
        "%2d. %-30s | R$ %s\n",
        $index + 1,
        substr($user->name, 0, 30),
        number_format($user->balance_withdrawn, 2, ',', '.')
    );
}

echo "\n";
echo "=============================================\n";
echo "  RESUMO FINAL\n";
echo "=============================================\n";
echo "Total disponível para saque: R$ " . number_format($totalAvailable, 2, ',', '.') . "\n";
echo "Menos saques pendentes: R$ " . number_format($pendingWithdrawals, 2, ',', '.') . "\n";
echo "-------------------------------------------\n";
echo "SALDO LÍQUIDO DISPONÍVEL: R$ " . number_format($liquidAvailable, 2, ',', '.') . "\n";
echo "=============================================\n";

