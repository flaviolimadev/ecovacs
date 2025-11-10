#!/usr/bin/env php
<?php

/**
 * Script de Debug - Teste de Saque Direto no Servidor
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Withdrawal;
use App\Services\VizzionPayService;
use Illuminate\Support\Facades\DB;

echo "\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "🐛 DEBUG - TESTE DE SAQUE DIRETO\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "\n";

try {
    $user = User::where('email', 'teste@saque.com')->first();
    
    if (!$user) {
        echo "❌ Usuário de teste não encontrado!\n";
        exit(1);
    }
    
    echo "✅ Usuário: {$user->name} (ID: {$user->id})\n";
    echo "   Saldo: R$ " . number_format($user->balance_withdrawn, 2, ',', '.') . "\n";
    echo "\n";
    
    // Testar VizzionPayService
    echo "🔧 Testando VizzionPayService...\n";
    $vizzionService = app(VizzionPayService::class);
    echo "   ✅ VizzionPayService instanciado\n";
    echo "\n";
    
    // Criar saque manualmente
    echo "💾 Criando registro de saque...\n";
    
    DB::beginTransaction();
    
    $withdrawal = Withdrawal::create([
        'user_id' => $user->id,
        'amount' => 50,
        'fee_amount' => 5,
        'net_amount' => 45,
        'cpf' => '11591670446',
        'pix_key' => '11591670446',
        'pix_key_type' => 'cpf',
        'status' => 'REQUESTED',
        'requested_at' => now(),
    ]);
    
    echo "   ✅ Withdrawal criado: ID #{$withdrawal->id}\n";
    echo "\n";
    
    // Testar processWithdrawal (simulação)
    echo "🔄 Testando processamento via Vizzion...\n";
    
    try {
        // Formatar CPF
        $cpfDigits = preg_replace('/\D/', '', $withdrawal->cpf);
        $cpfFormatted = sprintf(
            '%s.%s.%s-%s',
            substr($cpfDigits, 0, 3),
            substr($cpfDigits, 3, 3),
            substr($cpfDigits, 6, 3),
            substr($cpfDigits, 9, 2)
        );
        
        echo "   CPF formatado: {$cpfFormatted}\n";
        
        $ownerIp = '127.0.0.1';
        $clientIdentifier = 'test_withdraw_' . $withdrawal->id . '_' . time();
        
        $transferData = [
            'identifier' => $clientIdentifier,
            'clientIdentifier' => $clientIdentifier,
            'callbackUrl' => 'https://ecovacs-app.woty8c.easypanel.host/api/v1/webhooks/vizzion',
            'amount' => (float) $withdrawal->net_amount,
            'discountFeeOfReceiver' => false,
            'pix' => [
                'type' => $withdrawal->pix_key_type,
                'key' => $withdrawal->pix_key,
            ],
            'owner' => [
                'ip' => $ownerIp,
                'name' => $user->name,
                'document' => [
                    'type' => 'cpf',
                    'number' => $cpfFormatted,
                ],
            ],
        ];
        
        echo "\n   📦 Payload preparado:\n";
        echo "   " . str_replace("\n", "\n   ", json_encode($transferData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . "\n";
        echo "\n";
        
        echo "   🚀 Enviando para Vizzion API...\n";
        $result = $vizzionService->createPixTransfer($transferData);
        
        echo "\n   📊 Resposta da Vizzion:\n";
        echo "   " . str_replace("\n", "\n   ", json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . "\n";
        echo "\n";
        
        if ($result['success']) {
            echo "   ✅ SUCESSO! Transferência enviada\n";
            $withdrawal->update([
                'status' => 'APPROVED',
                'raw_response' => $result['raw_response'] ?? [],
                'approved_at' => now(),
            ]);
        } else {
            echo "   ❌ ERRO na API Vizzion\n";
            $withdrawal->update([
                'raw_response' => $result,
                'error_message' => $result['error'] ?? 'Erro desconhecido',
            ]);
        }
        
    } catch (\Exception $e) {
        echo "   ❌ EXCEÇÃO: " . $e->getMessage() . "\n";
        echo "   Arquivo: " . $e->getFile() . "\n";
        echo "   Linha: " . $e->getLine() . "\n";
        echo "\n";
        echo "   Stack Trace:\n";
        echo "   " . str_replace("\n", "\n   ", $e->getTraceAsString()) . "\n";
    }
    
    DB::rollBack();
    echo "\n";
    echo "✅ Transação revertida (teste concluído)\n";
    echo "\n";
    
} catch (\Exception $e) {
    echo "\n❌ ERRO GERAL:\n";
    echo "   Mensagem: " . $e->getMessage() . "\n";
    echo "   Arquivo: " . $e->getFile() . "\n";
    echo "   Linha: " . $e->getLine() . "\n";
    echo "\n";
}

echo "═══════════════════════════════════════════════════════════\n";
echo "\n";

