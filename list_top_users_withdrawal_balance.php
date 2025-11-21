<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=============================================\n";
echo "  TOP USUÁRIOS COM MAIOR SALDO PARA SAQUE\n";
echo "=============================================\n\n";

// Pegar todos os usuários com balance_withdrawn > 0, ordenados do maior para o menor
$users = User::where('balance_withdrawn', '>', 0)
    ->orderBy('balance_withdrawn', 'desc')
    ->get();

$totalUsers = $users->count();
$totalAmount = $users->sum('balance_withdrawn');

echo "📊 Total de usuários com saldo disponível: {$totalUsers}\n";
echo "💰 Soma total disponível para saque: R$ " . number_format($totalAmount, 2, ',', '.') . "\n\n";

echo "═══════════════════════════════════════════════════════════════════════════════\n";
echo sprintf("%-5s %-40s %-20s %-15s\n", "#", "USUÁRIO", "EMAIL", "SALDO PARA SAQUE");
echo "═══════════════════════════════════════════════════════════════════════════════\n";

$position = 1;
foreach ($users as $user) {
    $name = mb_substr($user->name, 0, 38);
    $email = mb_substr($user->email, 0, 18);
    $balance = number_format($user->balance_withdrawn, 2, ',', '.');
    
    // Destacar os top 10
    if ($position <= 10) {
        echo sprintf("%-5s %-40s %-20s R$ %12s 🏆\n", 
            $position, 
            $name, 
            $email, 
            $balance
        );
    } else {
        echo sprintf("%-5s %-40s %-20s R$ %12s\n", 
            $position, 
            $name, 
            $email, 
            $balance
        );
    }
    
    $position++;
}

echo "═══════════════════════════════════════════════════════════════════════════════\n\n";

// Estatísticas adicionais
echo "📈 ESTATÍSTICAS\n";
echo "-------------------------------------------\n";
echo "Média por usuário: R$ " . number_format($totalAmount / $totalUsers, 2, ',', '.') . "\n";
echo "Maior saldo: R$ " . number_format($users->first()->balance_withdrawn, 2, ',', '.') . " (" . $users->first()->name . ")\n";
echo "Menor saldo: R$ " . number_format($users->last()->balance_withdrawn, 2, ',', '.') . " (" . $users->last()->name . ")\n";

// Distribuição por faixas
echo "\n💵 DISTRIBUIÇÃO POR FAIXAS\n";
echo "-------------------------------------------\n";

$faixas = [
    ['min' => 0, 'max' => 50, 'label' => 'R$ 0,00 - R$ 50,00'],
    ['min' => 50, 'max' => 100, 'label' => 'R$ 50,01 - R$ 100,00'],
    ['min' => 100, 'max' => 200, 'label' => 'R$ 100,01 - R$ 200,00'],
    ['min' => 200, 'max' => 500, 'label' => 'R$ 200,01 - R$ 500,00'],
    ['min' => 500, 'max' => 1000, 'label' => 'R$ 500,01 - R$ 1.000,00'],
    ['min' => 1000, 'max' => PHP_INT_MAX, 'label' => 'Acima de R$ 1.000,00'],
];

foreach ($faixas as $faixa) {
    $count = User::where('balance_withdrawn', '>', $faixa['min'])
        ->where('balance_withdrawn', '<=', $faixa['max'])
        ->count();
    
    $sum = User::where('balance_withdrawn', '>', $faixa['min'])
        ->where('balance_withdrawn', '<=', $faixa['max'])
        ->sum('balance_withdrawn');
    
    echo sprintf("%-30s: %3d usuários | Total: R$ %10s\n", 
        $faixa['label'], 
        $count, 
        number_format($sum, 2, ',', '.')
    );
}

echo "\n✅ Listagem concluída!\n\n";

