#!/usr/bin/env php
<?php

/**
 * Script de teste para a API de detalhes de usuário
 * Uso: php test_user_details.php [user_id]
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Cycle;
use App\Models\Ledger;

echo "=== TESTE DE DETALHES DE USUÁRIO ===\n\n";

// ID do usuário (padrão: 1, ou passado por argumento)
$userId = $argv[1] ?? 1;

echo "Testando com usuário ID: {$userId}\n\n";

try {
    // 1. Buscar usuário
    echo "1. Buscando usuário...\n";
    $user = User::findOrFail($userId);
    echo "   ✓ Usuário encontrado: {$user->name} ({$user->email})\n\n";

    // 2. Buscar ciclos
    echo "2. Buscando ciclos...\n";
    $cycles = Cycle::where('user_id', $userId)->get();
    echo "   ✓ Ciclos encontrados: {$cycles->count()}\n";
    foreach ($cycles as $cycle) {
        echo "     - Ciclo #{$cycle->id}: Status={$cycle->status}, Valor={$cycle->amount}\n";
    }
    echo "\n";

    // 3. Buscar extrato
    echo "3. Buscando extrato...\n";
    $ledger = Ledger::where('user_id', $userId)->limit(10)->get();
    echo "   ✓ Entradas encontradas: {$ledger->count()}\n";
    foreach ($ledger as $entry) {
        echo "     - {$entry->type}: {$entry->description} = R$ {$entry->amount}\n";
    }
    echo "\n";

    // 4. Buscar rede de indicações
    echo "4. Buscando rede de indicações...\n";
    $level1 = User::where('referred_by_id', $userId)->get();
    echo "   ✓ Nível 1: {$level1->count()} indicados\n";
    
    if ($level1->count() > 0) {
        $level1Ids = $level1->pluck('id')->toArray();
        $level2 = User::whereIn('referred_by_id', $level1Ids)->get();
        echo "   ✓ Nível 2: {$level2->count()} indicados\n";
        
        if ($level2->count() > 0) {
            $level2Ids = $level2->pluck('id')->toArray();
            $level3 = User::whereIn('referred_by_id', $level2Ids)->get();
            echo "   ✓ Nível 3: {$level3->count()} indicados\n";
        }
    }
    echo "\n";

    // 5. Testar a API diretamente
    echo "5. Testando endpoint da API...\n";
    
    $controller = new \App\Http\Controllers\API\V1\Admin\UserController();
    $response = $controller->show($userId);
    
    $data = json_decode($response->getContent(), true);
    
    if (isset($data['error'])) {
        echo "   ✗ ERRO NA API:\n";
        echo "     Código: {$data['error']['code']}\n";
        echo "     Mensagem: {$data['error']['message']}\n";
        if (isset($data['error']['details'])) {
            echo "     Detalhes: {$data['error']['details']}\n";
        }
        exit(1);
    }
    
    if (isset($data['data'])) {
        echo "   ✓ API retornou dados com sucesso!\n";
        echo "     - Usuário: {$data['data']['user']['name']}\n";
        echo "     - Ciclos: {$data['data']['cycles']['summary']['total']}\n";
        echo "     - Extrato: {$data['data']['ledger']['showing']} de {$data['data']['ledger']['total_entries']}\n";
        echo "     - Rede: {$data['data']['referral_network']['total_referrals']} indicados\n";
    } else {
        echo "   ✗ Resposta inesperada da API\n";
        echo json_encode($data, JSON_PRETTY_PRINT);
        exit(1);
    }
    
    echo "\n✓ TODOS OS TESTES PASSARAM!\n";
    
} catch (\Exception $e) {
    echo "\n✗ ERRO: {$e->getMessage()}\n";
    echo "Arquivo: {$e->getFile()}:{$e->getLine()}\n";
    echo "\nStack Trace:\n{$e->getTraceAsString()}\n";
    exit(1);
}

