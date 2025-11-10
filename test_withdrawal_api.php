#!/usr/bin/env php
<?php

/**
 * Script de Teste - Solicitação de Saque via API
 * 
 * Este script testa o fluxo completo de saque:
 * 1. Login do usuário
 * 2. Solicitar saque
 * 3. Verificar processamento automático (se ≤ R$ 300)
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

echo "\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "🧪 TESTE DE SAQUE VIA API\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "\n";

// Configurações
$apiUrl = env('APP_URL', 'http://localhost:8000');
$cpf = '11591670446';
$pixKey = $cpf; // Usando o CPF como chave PIX
$pixKeyType = 'cpf';
$amount = 50.00; // R$ 50,00 (valor mínimo, deve processar automaticamente)

echo "📋 CONFIGURAÇÕES:\n";
echo "   API URL: {$apiUrl}\n";
echo "   CPF: {$cpf}\n";
echo "   Chave PIX: {$pixKey}\n";
echo "   Tipo: {$pixKeyType}\n";
echo "   Valor: R$ " . number_format($amount, 2, ',', '.') . "\n";
echo "\n";

try {
    // 1. Buscar ou criar usuário de teste
    echo "1️⃣ Buscando usuário de teste...\n";
    
    $user = User::where('email', 'teste@saque.com')->first();
    
    if (!$user) {
        echo "   ℹ️  Usuário não encontrado, criando...\n";
        $user = User::create([
            'name' => 'Usuário Teste Saque',
            'email' => 'teste@saque.com',
            'password' => bcrypt('password123'),
            'phone' => '11' . rand(900000000, 999999999), // Telefone único
            'role' => 'user',
            'balance' => 0,
            'balance_withdrawn' => 5000, // R$ 5000 disponível para saque
            'referral_code' => 'TEST' . strtoupper(substr(uniqid(), -6)),
        ]);
        echo "   ✅ Usuário criado com ID: {$user->id}\n";
    } else {
        echo "   ✅ Usuário encontrado: {$user->name} (ID: {$user->id})\n";
        
        // Garantir saldo para teste
        if ($user->balance_withdrawn < $amount) {
            $user->balance_withdrawn = 5000;
            $user->save();
            echo "   💰 Saldo ajustado para R$ 5.000,00\n";
        }
    }
    
    echo "   Saldo disponível para saque: R$ " . number_format($user->balance_withdrawn, 2, ',', '.') . "\n";
    echo "\n";

    // 2. Criar token de autenticação
    echo "2️⃣ Gerando token de autenticação...\n";
    $token = $user->createToken('test-withdrawal')->plainTextToken;
    echo "   ✅ Token gerado\n";
    echo "\n";

    // 3. Solicitar saque via API
    echo "3️⃣ Solicitando saque via API...\n";
    echo "   POST {$apiUrl}/api/v1/withdrawals\n";
    
    $response = Http::withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
        'Content-Type' => 'application/json',
    ])->post($apiUrl . '/api/v1/withdrawals', [
        'amount' => $amount,
        'cpf' => $cpf,
        'pix_key' => $pixKey,
        'pix_key_type' => $pixKeyType,
    ]);

    echo "   Status Code: " . $response->status() . "\n";
    echo "\n";

    if ($response->successful()) {
        echo "✅ SAQUE SOLICITADO COM SUCESSO!\n";
        echo "═══════════════════════════════════════════════════════════\n";
        echo "\n";
        
        $data = $response->json()['data'] ?? $response->json();
        
        echo "📊 DETALHES DO SAQUE:\n";
        echo "   ID: #{$data['id']}\n";
        echo "   Valor Bruto: R$ " . number_format($data['amount'], 2, ',', '.') . "\n";
        echo "   Taxa (10%): R$ " . number_format($data['fee_amount'], 2, ',', '.') . "\n";
        echo "   Valor Líquido: R$ " . number_format($data['net_amount'], 2, ',', '.') . "\n";
        echo "   Status: {$data['status']}\n";
        echo "   Data: {$data['requested_at']}\n";
        echo "\n";
        echo "💬 Mensagem: {$data['message']}\n";
        echo "\n";

        // 4. Verificar detalhes no banco
        echo "4️⃣ Verificando no banco de dados...\n";
        
        $withdrawal = DB::table('withdrawals')->find($data['id']);
        
        if ($withdrawal) {
            echo "   ✅ Registro encontrado\n";
            echo "   Status: {$withdrawal->status}\n";
            echo "   Transaction ID: " . ($withdrawal->transaction_id ?? 'N/A') . "\n";
            
            if ($withdrawal->error_message) {
                echo "   ⚠️  Erro: {$withdrawal->error_message}\n";
            }
            
            if ($withdrawal->raw_response) {
                echo "\n";
                echo "📦 RESPOSTA DA VIZZION:\n";
                echo "─────────────────────────────────────────────────────────\n";
                $rawResponse = json_decode($withdrawal->raw_response, true);
                echo json_encode($rawResponse, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                echo "\n─────────────────────────────────────────────────────────\n";
            }
        }
        echo "\n";

        // 5. Verificar saldo atualizado
        echo "5️⃣ Verificando saldo do usuário...\n";
        $user->refresh();
        echo "   Saldo disponível para saque: R$ " . number_format($user->balance_withdrawn, 2, ',', '.') . "\n";
        echo "   Total sacado: R$ " . number_format($user->total_withdrawn, 2, ',', '.') . "\n";
        echo "\n";

        // 6. Verificar ledger (extrato)
        echo "6️⃣ Verificando extrato (ledger)...\n";
        $ledgerEntry = DB::table('ledger')
            ->where('user_id', $user->id)
            ->where('reference_type', 'App\Models\Withdrawal')
            ->where('reference_id', $data['id'])
            ->first();
        
        if ($ledgerEntry) {
            echo "   ✅ Entrada no extrato criada\n";
            echo "   Tipo: {$ledgerEntry->type}\n";
            echo "   Operação: {$ledgerEntry->operation}\n";
            echo "   Valor: R$ " . number_format($ledgerEntry->amount, 2, ',', '.') . "\n";
            echo "   Descrição: {$ledgerEntry->description}\n";
        } else {
            echo "   ⚠️  Nenhuma entrada encontrada no extrato\n";
        }
        echo "\n";

        echo "═══════════════════════════════════════════════════════════\n";
        echo "🎉 TESTE CONCLUÍDO COM SUCESSO!\n";
        echo "═══════════════════════════════════════════════════════════\n";
        
        if ($amount <= 300) {
            echo "\n";
            echo "💡 NOTA: Como o valor é ≤ R$ 300, o saque foi processado\n";
            echo "   AUTOMATICAMENTE via Vizzion. Verifique os logs:\n";
            echo "\n";
            echo "   tail -f storage/logs/laravel.log | grep 'Transferência PIX'\n";
            echo "\n";
        }

    } else {
        echo "❌ ERRO AO SOLICITAR SAQUE\n";
        echo "═══════════════════════════════════════════════════════════\n";
        echo "\n";
        echo "Status Code: " . $response->status() . "\n";
        echo "\n";
        echo "Resposta:\n";
        echo "─────────────────────────────────────────────────────────\n";
        echo json_encode($response->json(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        echo "\n─────────────────────────────────────────────────────────\n";
        echo "\n";
    }

} catch (\Exception $e) {
    echo "\n";
    echo "❌ ERRO DURANTE O TESTE\n";
    echo "═══════════════════════════════════════════════════════════\n";
    echo "\n";
    echo "Mensagem: " . $e->getMessage() . "\n";
    echo "Arquivo: " . $e->getFile() . "\n";
    echo "Linha: " . $e->getLine() . "\n";
    echo "\n";
    echo "Stack Trace:\n";
    echo "─────────────────────────────────────────────────────────\n";
    echo $e->getTraceAsString();
    echo "\n─────────────────────────────────────────────────────────\n";
    echo "\n";
}

echo "\n";

