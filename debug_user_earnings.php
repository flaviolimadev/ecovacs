<?php

/**
 * Script de diagnóstico para rendimentos de um usuário
 *
 * Uso:
 *   php debug_user_earnings.php email@exemplo.com
 *
 * Ele mostra:
 * - Dados do usuário
 * - Ciclos (investimentos) do usuário
 * - Último rendimento (earnings) por ciclo
 * - Motivos comuns para NÃO estar recebendo rendimento diário
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Cycle;
use App\Models\Earning;
use Carbon\Carbon;

if (!isset($argv[1])) {
    echo "Uso: php debug_user_earnings.php email@exemplo.com\n";
    exit(1);
}

$email = $argv[1];

echo "\n=============================================\n";
echo "  DEBUG DE RENDIMENTOS PARA: {$email}\n";
echo "=============================================\n\n";

$user = User::where('email', $email)->first();

if (!$user) {
    echo "❌ Usuário não encontrado com este e-mail.\n\n";
    exit(1);
}

echo "👤 Usuário: {$user->name} (ID: {$user->id})\n";
echo "Role: {$user->role}\n";
echo "Ativo: " . ($user->is_active ? 'SIM' : 'NÃO') . "\n";
echo "Saldo para saque (balance_withdrawn): R$ " . number_format((float)$user->balance_withdrawn, 2, ',', '.') . "\n";
echo "Total ganho (total_earned): R$ " . number_format((float)$user->total_earned, 2, ',', '.') . "\n\n";

$cycles = Cycle::where('user_id', $user->id)
    ->with('plan')
    ->orderBy('created_at', 'desc')
    ->get();

if ($cycles->isEmpty()) {
    echo "❌ Nenhum ciclo (investimento) encontrado para este usuário.\n\n";
    exit(0);
}

echo "Ciclos encontrados: {$cycles->count()}\n\n";

foreach ($cycles as $cycle) {
    $planName = $cycle->plan ? $cycle->plan->name : 'N/A';
    $status = $cycle->status;
    $type = $cycle->type;
    $dailyIncome = (float) $cycle->daily_income;
    $durationDays = $cycle->duration_days;
    $daysPaid = $cycle->days_paid ?? 0;
    $startedAt = $cycle->started_at ? Carbon::parse($cycle->started_at) : null;

    echo "---------------------------------------------\n";
    echo "Ciclo #{$cycle->id} | Plano: {$planName}\n";
    echo "Status: {$status} | Tipo: {$type}\n";
    echo "Valor investido: R$ " . number_format((float)$cycle->amount, 2, ',', '.') . "\n";
    echo "Renda diária (daily_income): R$ " . number_format($dailyIncome, 2, ',', '.') . "\n";
    echo "Duração: {$durationDays} dias | Dias pagos: {$daysPaid}\n";
    echo "Iniciado em: " . ($startedAt ? $startedAt->format('d/m/Y H:i:s') : 'N/A') . "\n";

    // Último rendimento
    $lastEarning = Earning::where('cycle_id', $cycle->id)
        ->orderBy('created_at', 'desc')
        ->first();

    if ($lastEarning) {
        $lastEarningAt = Carbon::parse($lastEarning->created_at);
        echo "📈 Último rendimento: R$ " . number_format((float)$lastEarning->value, 2, ',', '.') .
            " em " . $lastEarningAt->format('d/m/Y H:i:s') . "\n";
    } else {
        echo "📈 Último rendimento: NENHUM (ainda não foi pago)\n";
    }

    // Possíveis motivos de não receber rendimento
    echo "🔍 Análise:\n";

    if ($status !== 'ACTIVE') {
        echo "  - ⚠️ Ciclo NÃO está ATIVO (status atual: {$status}).\n";
    }

    if ($type !== 'DAILY') {
        echo "  - ⚠️ Tipo do ciclo não é DAILY (tipo atual: {$type}).\n";
    }

    if ($dailyIncome <= 0) {
        echo "  - ⚠️ daily_income é 0 ou nulo. Não há valor diário para pagar.\n";
    }

    if ($daysPaid >= $durationDays) {
        echo "  - ℹ️ Todos os dias já foram pagos ({$daysPaid}/{$durationDays}).\n";
    }

    if ($startedAt) {
        $now = Carbon::now();
        if ($startedAt->isSameDay($now)) {
            echo "  - ℹ️ Ciclo começou HOJE. O script só paga após 24h.\n";
        }
    }

    if ($lastEarning) {
        $lastEarningAt = Carbon::parse($lastEarning->created_at);
        $diffHours = $lastEarningAt->diffInHours(Carbon::now());
        echo "  - ⏱️ Horas desde o último rendimento: {$diffHours}h\n";
    }

    echo "\n";
}

echo "=============================================\n\n";

exit(0);


