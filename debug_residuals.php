#!/usr/bin/env php
<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Cycle;
use App\Models\Earning;
use Illuminate\Support\Facades\DB;

echo "\n";
echo "═══════════════════════════════════════════\n";
echo "  DEBUG: COMISSÕES RESIDUAIS\n";
echo "═══════════════════════════════════════════\n\n";

// 1. Buscar residual tiers configurados
$residualTiers = DB::table('residual_tiers')
    ->where('scheme_id', 1)
    ->orderBy('level')
    ->get();

echo "📊 CONFIGURAÇÃO DE RESIDUAIS:\n";
echo "─────────────────────────────────────────\n";
if ($residualTiers->isEmpty()) {
    echo "❌ NENHUM TIER DE RESIDUAL CONFIGURADO!\n";
    echo "   Isso explica por que não está pagando residuais.\n\n";
    
    echo "💡 SOLUÇÃO: Inserir tiers de residual\n";
    echo "─────────────────────────────────────────\n";
    echo "INSERT INTO residual_tiers (scheme_id, level, percent, created_at, updated_at) VALUES\n";
    echo "(1, 1, 2.50, NOW(), NOW()),  -- Nível 1: 2.5%\n";
    echo "(1, 2, 0.50, NOW(), NOW()),  -- Nível 2: 0.5%\n";
    echo "(1, 3, 0.15, NOW(), NOW());  -- Nível 3: 0.15%\n\n";
    exit(0);
} else {
    foreach ($residualTiers as $tier) {
        echo "  Nível {$tier->level}: {$tier->percent}%\n";
    }
}

echo "\n";

// 2. Pegar um usuário que recebeu rendimento recentemente
$recentEarning = Earning::with(['cycle.user'])
    ->where('type', 'DAILY')
    ->orderBy('created_at', 'desc')
    ->first();

if (!$recentEarning) {
    echo "❌ Nenhum rendimento encontrado para testar\n\n";
    exit(0);
}

$user = $recentEarning->cycle->user;
$earningValue = $recentEarning->value;

echo "👤 TESTANDO COM RENDIMENTO RECENTE:\n";
echo "─────────────────────────────────────────\n";
echo "Usuário: {$user->name} (ID: {$user->id})\n";
echo "Rendimento: R$ " . number_format($earningValue, 2, ',', '.') . "\n";
echo "Earning ID: {$recentEarning->id}\n";
echo "Data: {$recentEarning->created_at}\n\n";

// 3. Buscar indicador (referrer)
echo "🌳 ÁRVORE DE INDICAÇÕES:\n";
echo "─────────────────────────────────────────\n";

$currentUser = $user;
$level = 1;
$totalResiduals = 0;

while ($level <= 3) {
    if (!$currentUser->referred_by) {
        echo "  Nível {$level}: (sem indicador)\n";
        break;
    }
    
    $referrer = User::find($currentUser->referred_by);
    
    if (!$referrer) {
        echo "  Nível {$level}: (indicador não encontrado)\n";
        break;
    }
    
    // Buscar tier
    $tier = $residualTiers->firstWhere('level', $level);
    
    if (!$tier) {
        echo "  Nível {$level}: {$referrer->name} - SEM TIER CONFIGURADO\n";
        break;
    }
    
    $residualAmount = ($earningValue * $tier->percent) / 100;
    $totalResiduals += $residualAmount;
    
    echo "  Nível {$level}: {$referrer->name} (ID: {$referrer->id})\n";
    echo "    └─ {$tier->percent}% de R$ " . number_format($earningValue, 2, ',', '.') . 
         " = R$ " . number_format($residualAmount, 2, ',', '.') . "\n";
    
    // Verificar se realmente recebeu no banco
    $receivedResidual = DB::table('ledger')
        ->where('user_id', $referrer->id)
        ->where('type', 'RESIDUAL_COMMISSION')
        ->where('reference_type', 'App\Models\Earning')
        ->where('reference_id', $recentEarning->id)
        ->first();
    
    if ($receivedResidual) {
        echo "    ✅ Recebido: R$ " . number_format($receivedResidual->amount, 2, ',', '.') . "\n";
    } else {
        echo "    ❌ NÃO ENCONTRADO NO LEDGER!\n";
    }
    
    echo "\n";
    
    $currentUser = $referrer;
    $level++;
}

echo "─────────────────────────────────────────\n";
echo "💰 Total esperado em residuais: R$ " . number_format($totalResiduals, 2, ',', '.') . "\n\n";

// 4. Verificar alguns ciclos aleatórios para ver a árvore
echo "═══════════════════════════════════════════\n";
echo "  ANÁLISE DE 5 USUÁRIOS ALEATÓRIOS\n";
echo "═══════════════════════════════════════════\n\n";

$randomUsers = User::whereHas('cycles')
    ->inRandomOrder()
    ->limit(5)
    ->get();

foreach ($randomUsers as $usr) {
    echo "👤 {$usr->name} (ID: {$usr->id})\n";
    
    $ref1 = $usr->referred_by ? User::find($usr->referred_by) : null;
    $ref2 = $ref1 && $ref1->referred_by ? User::find($ref1->referred_by) : null;
    $ref3 = $ref2 && $ref2->referred_by ? User::find($ref2->referred_by) : null;
    
    echo "  └─ Nível 1: " . ($ref1 ? "{$ref1->name} (ID: {$ref1->id})" : "❌ Nenhum") . "\n";
    echo "     └─ Nível 2: " . ($ref2 ? "{$ref2->name} (ID: {$ref2->id})" : "❌ Nenhum") . "\n";
    echo "        └─ Nível 3: " . ($ref3 ? "{$ref3->name} (ID: {$ref3->id})" : "❌ Nenhum") . "\n";
    echo "\n";
}

echo "═══════════════════════════════════════════\n\n";

