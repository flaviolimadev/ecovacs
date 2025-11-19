<?php

/**
 * Script para verificar inconsistências nos saques
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;

echo "\n";
echo "=============================================\n";
echo "  VERIFICAÇÃO DE INCONSISTÊNCIAS NOS SAQUES\n";
echo "=============================================\n\n";

// Buscar usuários com saques pendentes que excedem o saldo
$usersWithIssues = DB::select("
    SELECT 
        u.id,
        u.name,
        u.email,
        u.balance_withdrawn,
        COALESCE(SUM(w.amount), 0) as total_pending_withdrawals
    FROM users u
    LEFT JOIN withdrawals w ON w.user_id = u.id 
        AND w.status IN ('REQUESTED', 'APPROVED')
    WHERE u.balance_withdrawn > 0 OR EXISTS (
        SELECT 1 FROM withdrawals w2 
        WHERE w2.user_id = u.id 
        AND w2.status IN ('REQUESTED', 'APPROVED')
    )
    GROUP BY u.id, u.name, u.email, u.balance_withdrawn
    HAVING COALESCE(SUM(w.amount), 0) > u.balance_withdrawn
    ORDER BY (COALESCE(SUM(w.amount), 0) - u.balance_withdrawn) DESC
    LIMIT 20
");

if (count($usersWithIssues) > 0) {
    echo "⚠️  ENCONTRADOS " . count($usersWithIssues) . " USUÁRIOS COM SAQUES PENDENTES MAIORES QUE O SALDO:\n\n";
    
    foreach ($usersWithIssues as $user) {
        $diff = $user->total_pending_withdrawals - $user->balance_withdrawn;
        echo "---------------------------------------------\n";
        echo "Usuário: {$user->name} ({$user->email})\n";
        echo "ID: {$user->id}\n";
        echo "Saldo disponível: R$ " . number_format($user->balance_withdrawn, 2, ',', '.') . "\n";
        echo "Saques pendentes: R$ " . number_format($user->total_pending_withdrawals, 2, ',', '.') . "\n";
        echo "⚠️  Diferença: R$ " . number_format($diff, 2, ',', '.') . "\n";
        echo "\n";
    }
} else {
    echo "✅ Nenhuma inconsistência encontrada!\n\n";
}

// Verificar saques aprovados
echo "=============================================\n";
echo "  SAQUES APROVADOS (TOP 10)\n";
echo "=============================================\n\n";

$approvedWithdrawals = Withdrawal::where('status', 'APPROVED')
    ->with('user')
    ->orderBy('amount', 'desc')
    ->limit(10)
    ->get();

if ($approvedWithdrawals->count() > 0) {
    foreach ($approvedWithdrawals as $withdrawal) {
        $user = $withdrawal->user;
        echo "Saque #{$withdrawal->id}\n";
        echo "Usuário: {$user->name} ({$user->email})\n";
        echo "Valor: R$ " . number_format($withdrawal->amount, 2, ',', '.') . "\n";
        echo "Saldo atual do usuário: R$ " . number_format($user->balance_withdrawn, 2, ',', '.') . "\n";
        echo "Data: {$withdrawal->requested_at}\n";
        echo "\n";
    }
} else {
    echo "Nenhum saque aprovado encontrado.\n\n";
}

echo "\n";

