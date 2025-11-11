#!/usr/bin/env php
<?php

echo "\n";
echo "========================================\n";
echo "  TESTE RÁPIDO DE SAQUE\n";
echo "========================================\n\n";

// 1. Verificar se o arquivo existe e tem o conteúdo correto
$file = __DIR__ . '/app/Http/Controllers/API/V1/WithdrawController.php';

if (!file_exists($file)) {
    echo "❌ ERRO: Arquivo WithdrawController.php não encontrado!\n";
    exit(1);
}

$content = file_get_contents($file);

echo "1️⃣  Verificando campos do Ledger...\n";

$checks = [
    'balance_type' => 0,
    "'type' => 'WITHDRAWAL'" => 0,
    "'reference_type' => Withdrawal::class" => 0,
    "'operation' => 'DEBIT'" => 0,
];

foreach ($checks as $search => $count) {
    $count = substr_count($content, $search);
    $status = $count > 0 ? '✅' : '❌';
    echo "   {$status} {$search}: {$count} ocorrência(s)\n";
}

echo "\n";

// 2. Verificar último erro no log
echo "2️⃣  Últimos erros de saque no log:\n";
$logFile = __DIR__ . '/storage/logs/laravel.log';

if (file_exists($logFile)) {
    $cmd = "grep -A 3 'Erro ao processar saque' {$logFile} | tail -20";
    $output = shell_exec($cmd);
    
    if (empty(trim($output))) {
        echo "   ✅ Nenhum erro recente encontrado\n";
    } else {
        echo $output;
    }
} else {
    echo "   ⚠️  Log não encontrado\n";
}

echo "\n";

// 3. Verificar estrutura da tabela ledger
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "3️⃣  Verificando estrutura da tabela ledger...\n";

$columns = Schema::getColumnListing('ledger');
$requiredColumns = ['type', 'reference_type', 'reference_id', 'amount', 'operation', 'balance_type'];

foreach ($requiredColumns as $col) {
    $status = in_array($col, $columns) ? '✅' : '❌';
    echo "   {$status} Coluna '{$col}'\n";
}

echo "\n";

// 4. Verificar último saque
echo "4️⃣  Último saque solicitado:\n";

$lastWithdrawal = DB::table('withdrawals')
    ->orderBy('id', 'desc')
    ->first();

if ($lastWithdrawal) {
    echo "   ID: {$lastWithdrawal->id}\n";
    echo "   User ID: {$lastWithdrawal->user_id}\n";
    echo "   Valor: R$ " . number_format($lastWithdrawal->amount, 2, ',', '.') . "\n";
    echo "   Status: {$lastWithdrawal->status}\n";
    echo "   Data: {$lastWithdrawal->created_at}\n";
} else {
    echo "   ⚠️  Nenhum saque encontrado\n";
}

echo "\n";
echo "========================================\n";
echo "  DIAGNÓSTICO CONCLUÍDO\n";
echo "========================================\n\n";

echo "💡 Para corrigir, execute:\n";
echo "   bash /app/FIX_WITHDRAWAL_SERVER.sh\n\n";

