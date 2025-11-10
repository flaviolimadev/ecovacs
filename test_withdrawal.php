#!/usr/bin/env php
<?php

/**
 * Script de teste para o sistema de saque
 * Uso: php test_withdrawal.php [user_id] [amount]
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Cycle;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\Log;

echo "=== TESTE DE SISTEMA DE SAQUE ===\n\n";

// Parâmetros
$userId = $argv[1] ?? 1;
$amount = $argv[2] ?? 50;

echo "Testando com:\n";
echo "  - Usuário ID: {$userId}\n";
echo "  - Valor: R$ {$amount}\n\n";

try {
    // 1. Buscar usuário
    echo "1. Verificando usuário...\n";
    $user = User::findOrFail($userId);
    echo "   ✓ Usuário: {$user->name} ({$user->email})\n";
    echo "   - Saldo para saque: R$ {$user->balance_withdrawn}\n";
    echo "   - CPF: " . ($user->cpf ?? 'NÃO CADASTRADO') . "\n\n";

    // 2. Verificar ciclos
    echo "2. Verificando ciclos...\n";
    $cyclesCount = Cycle::where('user_id', $userId)->count();
    echo "   - Total de ciclos: {$cyclesCount}\n";
    
    if ($cyclesCount === 0) {
        echo "   ✗ ERRO: Usuário não tem nenhum ciclo!\n";
        echo "   → O sistema requer pelo menos 1 ciclo para sacar.\n\n";
        exit(1);
    }
    echo "   ✓ Usuário tem ciclos\n\n";

    // 3. Verificar saldo
    echo "3. Verificando saldo...\n";
    if ($user->balance_withdrawn < $amount) {
        echo "   ✗ ERRO: Saldo insuficiente!\n";
        echo "   - Disponível: R$ {$user->balance_withdrawn}\n";
        echo "   - Necessário: R$ {$amount}\n\n";
        exit(1);
    }
    echo "   ✓ Saldo suficiente\n\n";

    // 4. Verificar configurações de saque
    echo "4. Verificando configurações de saque...\n";
    $settings = \App\Models\Setting::whereIn('key', [
        'withdraw.min',
        'withdraw.fee',
        'withdraw.daily_limit_per_user',
        'withdraw.window'
    ])->pluck('value', 'key');
    
    $minAmount = 50;
    $feePercent = 0.10;
    $dailyLimit = 1;
    
    if (isset($settings['withdraw.min'])) {
        $minValue = json_decode($settings['withdraw.min'], true);
        $minAmount = is_numeric($minValue) ? $minValue : 50;
    }
    
    if (isset($settings['withdraw.fee'])) {
        $feeValue = json_decode($settings['withdraw.fee'], true);
        $feePercent = is_numeric($feeValue) ? $feeValue : 0.10;
    }
    
    echo "   - Valor mínimo: R$ {$minAmount}\n";
    echo "   - Taxa: " . ($feePercent * 100) . "%\n";
    echo "   - Limite diário: {$dailyLimit} saque(s)\n\n";

    if ($amount < $minAmount) {
        echo "   ✗ ERRO: Valor abaixo do mínimo!\n";
        echo "   - Solicitado: R$ {$amount}\n";
        echo "   - Mínimo: R$ {$minAmount}\n\n";
        exit(1);
    }

    // 5. Verificar limite diário
    echo "5. Verificando limite diário...\n";
    $withdrawalsToday = Withdrawal::where('user_id', $userId)
        ->whereDate('requested_at', today())
        ->whereNotIn('status', ['REJECTED', 'CANCELLED'])
        ->count();
    
    echo "   - Saques hoje: {$withdrawalsToday}\n";
    
    if ($withdrawalsToday >= $dailyLimit) {
        echo "   ✗ ERRO: Limite diário atingido!\n\n";
        exit(1);
    }
    echo "   ✓ Pode fazer saque hoje\n\n";

    // 6. Verificar dados PIX
    echo "6. Verificando dados necessários...\n";
    if (!$user->cpf) {
        echo "   ✗ ERRO: CPF não cadastrado!\n";
        echo "   → Usuário precisa cadastrar CPF antes de sacar.\n\n";
        exit(1);
    }
    echo "   ✓ CPF cadastrado\n\n";

    // 7. Simular validações da API
    echo "7. Testando validações da API...\n";
    
    $validator = \Illuminate\Support\Facades\Validator::make([
        'amount' => $amount,
        'cpf' => $user->cpf,
        'pix_key' => $user->cpf,
        'pix_key_type' => 'cpf',
    ], [
        'amount' => 'required|numeric|min:0.01',
        'cpf' => 'required|string|size:11',
        'pix_key' => 'required|string|max:255',
        'pix_key_type' => 'required|in:cpf,cnpj,email,phone,random',
    ]);
    
    if ($validator->fails()) {
        echo "   ✗ ERRO DE VALIDAÇÃO:\n";
        foreach ($validator->errors()->all() as $error) {
            echo "     - {$error}\n";
        }
        echo "\n";
        exit(1);
    }
    echo "   ✓ Dados válidos\n\n";

    // 8. Testar cálculos
    echo "8. Testando cálculos...\n";
    $feeAmount = $amount * $feePercent;
    $netAmount = $amount - $feeAmount;
    
    echo "   - Valor solicitado: R$ " . number_format($amount, 2, ',', '.') . "\n";
    echo "   - Taxa ({$feePercent}%): R$ " . number_format($feeAmount, 2, ',', '.') . "\n";
    echo "   - Valor líquido: R$ " . number_format($netAmount, 2, ',', '.') . "\n\n";

    // 9. Verificar estrutura da tabela withdrawals
    echo "9. Verificando estrutura da tabela 'withdrawals'...\n";
    $columns = \Illuminate\Support\Facades\Schema::getColumnListing('withdrawals');
    $requiredColumns = ['user_id', 'amount', 'fee_amount', 'net_amount', 'cpf', 'pix_key', 'pix_key_type', 'status', 'requested_at'];
    
    foreach ($requiredColumns as $col) {
        if (!in_array($col, $columns)) {
            echo "   ✗ ERRO: Coluna '{$col}' não existe na tabela!\n";
            exit(1);
        }
    }
    echo "   ✓ Todas as colunas necessárias existem\n\n";

    // 10. Verificar estrutura da tabela ledger
    echo "10. Verificando estrutura da tabela 'ledger'...\n";
    $ledgerColumns = \Illuminate\Support\Facades\Schema::getColumnListing('ledger');
    $requiredLedgerColumns = ['user_id', 'type', 'reference_type', 'reference_id', 'description', 'amount', 'operation', 'balance_type'];
    
    foreach ($requiredLedgerColumns as $col) {
        if (!in_array($col, $ledgerColumns)) {
            echo "   ✗ ERRO: Coluna '{$col}' não existe na tabela 'ledger'!\n";
            exit(1);
        }
    }
    echo "   ✓ Todas as colunas necessárias existem no ledger\n\n";

    echo "✓ TODOS OS TESTES PASSARAM!\n";
    echo "\nO sistema de saque está configurado corretamente.\n";
    echo "Se ainda houver erro, verifique:\n";
    echo "  1. Logs do Laravel: tail -f storage/logs/laravel.log\n";
    echo "  2. Horário de funcionamento (janela de saque)\n";
    echo "  3. Configuração da API Vizzion\n";
    
} catch (\Exception $e) {
    echo "\n✗ ERRO FATAL: {$e->getMessage()}\n";
    echo "Arquivo: {$e->getFile()}:{$e->getLine()}\n";
    echo "\nStack Trace:\n{$e->getTraceAsString()}\n";
    exit(1);
}

