<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 TESTANDO CRIAÇÃO DE SAQUE\n";
echo "=============================\n\n";

try {
    $user = \App\Models\User::first();
    
    if (!$user) {
        echo "❌ Nenhum usuário encontrado!\n";
        exit(1);
    }
    
    echo "✅ Usuário: {$user->name} (ID: {$user->id})\n";
    echo "   Balance withdrawn: R$ {$user->balance_withdrawn}\n\n";
    
    // Ajustar saldo para teste
    if ($user->balance_withdrawn < 50) {
        $user->balance_withdrawn = 5000;
        $user->save();
        echo "💰 Saldo ajustado para teste: R$ 5000\n\n";
    }
    
    echo "1️⃣ Testando criação de Withdrawal...\n";
    DB::beginTransaction();
    
    $withdrawal = \App\Models\Withdrawal::create([
        'user_id' => $user->id,
        'amount' => 100,
        'fee_amount' => 10,
        'net_amount' => 90,
        'cpf' => '12345678901',
        'pix_key' => '12345678901',
        'pix_key_type' => 'cpf',
        'status' => 'REQUESTED',
        'requested_at' => now(),
    ]);
    
    echo "   ✅ Withdrawal criado: ID {$withdrawal->id}\n\n";
    
    echo "2️⃣ Testando criação de Ledger...\n";
    $ledger = \App\Models\Ledger::create([
        'user_id' => $user->id,
        'type' => 'WITHDRAWAL',
        'reference_type' => \App\Models\Withdrawal::class,
        'reference_id' => $withdrawal->id,
        'description' => 'Teste de saque PIX - R$ 100,00',
        'amount' => 100,
        'operation' => 'DEBIT',
    ]);
    
    echo "   ✅ Ledger criado: ID {$ledger->id}\n\n";
    
    DB::rollBack();
    echo "✅ TESTE COMPLETO - Transação revertida\n";
    echo "\n🎉 Tudo funcionando! O código está correto.\n";
    
} catch (\Exception $e) {
    echo "\n❌ ERRO ENCONTRADO:\n";
    echo "   Mensagem: {$e->getMessage()}\n";
    echo "   Arquivo: {$e->getFile()}:{$e->getLine()}\n";
    echo "\n";
    echo "Stack trace:\n";
    echo $e->getTraceAsString();
    exit(1);
}

