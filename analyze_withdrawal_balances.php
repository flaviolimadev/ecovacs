<?php

/**
 * Script para analisar valores disponíveis para saque
 * - Total disponível para saque
 * - Top 10 usuários com maiores saldos
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;

echo "\n";
echo "=============================================\n";
echo "  ANÁLISE DE VALORES PARA SAQUE\n";
echo "=============================================\n\n";

// 1. Total disponível para saque (soma de todos os balance_withdrawn)
$totalAvailable = User::sum('balance_withdrawn');
$totalUsers = User::where('balance_withdrawn', '>', 0)->count();
$totalUsersAll = User::count();

echo "💰 VALOR TOTAL DISPONÍVEL PARA SAQUE:\n";
echo "   R$ " . number_format($totalAvailable, 2, ',', '.') . "\n";
echo "   Usuários com saldo disponível: {$totalUsers} de {$totalUsersAll}\n\n";

// 2. Top 10 usuários com maiores saldos para saque
echo "=============================================\n";
echo "  TOP 10 USUÁRIOS COM MAIORES SALDOS\n";
echo "=============================================\n\n";

$topUsers = User::where('balance_withdrawn', '>', 0)
    ->orderBy('balance_withdrawn', 'desc')
    ->limit(10)
    ->get(['id', 'name', 'email', 'balance_withdrawn', 'total_earned', 'total_withdrawn']);

if ($topUsers->count() > 0) {
    $position = 1;
    foreach ($topUsers as $user) {
        echo "{$position}º - {$user->name}\n";
        echo "   Email: {$user->email}\n";
        echo "   ID: {$user->id}\n";
        echo "   💰 Saldo disponível para saque: R$ " . number_format($user->balance_withdrawn, 2, ',', '.') . "\n";
        echo "   📈 Total ganho: R$ " . number_format($user->total_earned ?? 0, 2, ',', '.') . "\n";
        echo "   💸 Total já sacado: R$ " . number_format($user->total_withdrawn ?? 0, 2, ',', '.') . "\n";
        
        // Verificar saques pendentes
        $pendingWithdrawals = Withdrawal::where('user_id', $user->id)
            ->whereIn('status', ['REQUESTED', 'APPROVED'])
            ->sum('amount');
        
        if ($pendingWithdrawals > 0) {
            echo "   ⏳ Saques pendentes: R$ " . number_format($pendingWithdrawals, 2, ',', '.') . "\n";
        }
        
        echo "\n";
        $position++;
    }
} else {
    echo "Nenhum usuário com saldo disponível encontrado.\n\n";
}

// 3. Estatísticas de saques
echo "=============================================\n";
echo "  ESTATÍSTICAS DE SAQUES\n";
echo "=============================================\n\n";

$totalWithdrawals = Withdrawal::count();
$totalWithdrawnAmount = Withdrawal::where('status', 'PAID')->sum('amount');
$pendingWithdrawals = Withdrawal::whereIn('status', ['REQUESTED', 'APPROVED'])->sum('amount');
$requestedWithdrawals = Withdrawal::where('status', 'REQUESTED')->count();
$approvedWithdrawals = Withdrawal::where('status', 'APPROVED')->count();
$paidWithdrawals = Withdrawal::where('status', 'PAID')->count();
$rejectedWithdrawals = Withdrawal::where('status', 'REJECTED')->count();

echo "Total de saques solicitados: {$totalWithdrawals}\n";
echo "  - Solicitados: {$requestedWithdrawals}\n";
echo "  - Aprovados: {$approvedWithdrawals}\n";
echo "  - Pagos: {$paidWithdrawals}\n";
echo "  - Rejeitados: {$rejectedWithdrawals}\n";
echo "\n";

echo "💰 Valores:\n";
echo "  - Total já pago em saques: R$ " . number_format($totalWithdrawnAmount, 2, ',', '.') . "\n";
echo "  - Saques pendentes (solicitados/aprovados): R$ " . number_format($pendingWithdrawals, 2, ',', '.') . "\n";
echo "\n";

// 4. Cálculo se todos solicitassem saque
echo "=============================================\n";
echo "  CENÁRIO: TODOS SOLICITAM SAQUE\n";
echo "=============================================\n\n";

$totalIfAllWithdraw = $totalAvailable;
$totalWithFees = $totalIfAllWithdraw * 0.90; // 10% de taxa
$totalFees = $totalIfAllWithdraw * 0.10;

echo "Se TODOS os usuários solicitassem saque agora:\n";
echo "  💰 Valor total solicitado: R$ " . number_format($totalIfAllWithdraw, 2, ',', '.') . "\n";
echo "  💸 Taxa (10%): R$ " . number_format($totalFees, 2, ',', '.') . "\n";
echo "  ✅ Valor líquido a pagar: R$ " . number_format($totalWithFees, 2, ',', '.') . "\n";
echo "  👥 Número de usuários: {$totalUsers}\n";
echo "\n";

// 5. Distribuição por faixas de valor
echo "=============================================\n";
echo "  DISTRIBUIÇÃO POR FAIXAS DE VALOR\n";
echo "=============================================\n\n";

$ranges = [
    ['min' => 0, 'max' => 50, 'label' => 'R$ 0 - R$ 50'],
    ['min' => 50, 'max' => 100, 'label' => 'R$ 50 - R$ 100'],
    ['min' => 100, 'max' => 300, 'label' => 'R$ 100 - R$ 300'],
    ['min' => 300, 'max' => 500, 'label' => 'R$ 300 - R$ 500'],
    ['min' => 500, 'max' => 1000, 'label' => 'R$ 500 - R$ 1.000'],
    ['min' => 1000, 'max' => 5000, 'label' => 'R$ 1.000 - R$ 5.000'],
    ['min' => 5000, 'max' => 10000, 'label' => 'R$ 5.000 - R$ 10.000'],
    ['min' => 10000, 'max' => PHP_INT_MAX, 'label' => 'Acima de R$ 10.000'],
];

foreach ($ranges as $range) {
    $count = User::where('balance_withdrawn', '>=', $range['min'])
        ->where('balance_withdrawn', '<', $range['max'])
        ->count();
    
    $totalInRange = User::where('balance_withdrawn', '>=', $range['min'])
        ->where('balance_withdrawn', '<', $range['max'])
        ->sum('balance_withdrawn');
    
    if ($count > 0) {
        echo "  {$range['label']}: {$count} usuários | Total: R$ " . number_format($totalInRange, 2, ',', '.') . "\n";
    }
}

echo "\n";

// 6. Resumo final
echo "=============================================\n";
echo "  RESUMO FINAL\n";
echo "=============================================\n\n";

echo "💰 Total disponível para saque: R$ " . number_format($totalAvailable, 2, ',', '.') . "\n";
echo "👥 Usuários com saldo: {$totalUsers}\n";
echo "💸 Total já sacado: R$ " . number_format($totalWithdrawnAmount, 2, ',', '.') . "\n";
echo "⏳ Saques pendentes: R$ " . number_format($pendingWithdrawals, 2, ',', '.') . "\n";
echo "✅ Saldo líquido disponível: R$ " . number_format($totalAvailable - $pendingWithdrawals, 2, ',', '.') . "\n";
echo "\n";

echo "\n";

