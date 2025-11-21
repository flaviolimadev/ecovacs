<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Cycle;
use App\Models\Plan;
use App\Models\User;
use Carbon\Carbon;

echo "=============================================\n";
echo "  CICLOS QUE VÃO FINALIZAR NOS PRÓXIMOS DIAS\n";
echo "=============================================\n\n";

$now = Carbon::now(config('app.timezone'));
echo "🕐 Análise realizada em: " . $now->format('d/m/Y H:i:s') . "\n";
echo "🌍 Timezone: " . config('app.timezone') . "\n\n";

// Dias para verificar
$daysToCheck = [
    ['date' => $now->copy()->addDay()->startOfDay(), 'label' => '21/11/2025 (Sexta-feira)'],
    ['date' => $now->copy()->addDays(2)->startOfDay(), 'label' => '22/11/2025 (Sábado)'],
];

foreach ($daysToCheck as $dayInfo) {
    $date = $dayInfo['date'];
    $dateEnd = $date->copy()->endOfDay();
    $label = $dayInfo['label'];
    
    echo "==========================================\n";
    echo "📅 " . $label . "\n";
    echo "==========================================\n\n";
    
    // Buscar ciclos que terminam neste dia (por ends_at)
    $cyclesByEndsAt = Cycle::where('status', 'ACTIVE')
        ->whereNotNull('ends_at')
        ->whereDate('ends_at', $date->toDateString())
        ->with(['user', 'plan'])
        ->orderBy('ends_at')
        ->get();
    
    // Buscar ciclos que vão completar duração
    $cyclesByDuration = Cycle::where('status', 'ACTIVE')
        ->where(function($query) use ($date) {
            // Ciclos DAILY que vão completar dias_paid = duration_days
            $query->where('type', 'DAILY')
                ->whereRaw('days_paid + 1 >= duration_days');
        })
        ->orWhere(function($query) use ($date) {
            // Ciclos END_CYCLE que vão completar dias_paid = duration_days
            $query->where('type', 'END_CYCLE')
                ->whereRaw('days_paid + 1 >= duration_days');
        })
        ->with(['user', 'plan'])
        ->get();
    
    // Filtrar apenas os que realmente vão finalizar neste dia específico
    $cyclesByDuration = $cyclesByDuration->filter(function($cycle) use ($date) {
        if (!$cycle->started_at) return false;
        
        $startedAt = Carbon::parse($cycle->started_at)->setTimezone(config('app.timezone'));
        $daysSinceStart = $startedAt->diffInDays($date);
        
        // Verifica se neste dia específico o ciclo vai atingir a duração
        return ($cycle->days_paid + $daysSinceStart - $startedAt->diffInDays(now())) >= $cycle->duration_days;
    });
    
    // Combinar e remover duplicatas
    $cycles = $cyclesByEndsAt->merge($cyclesByDuration)->unique('id');
    
    if ($cycles->isEmpty()) {
        echo "✅ Nenhum ciclo vai finalizar neste dia.\n\n";
        continue;
    }
    
    echo "📦 Total: " . $cycles->count() . " ciclos\n\n";
    
    $totalPending = 0;
    
    foreach ($cycles as $cycle) {
        $user = $cycle->user;
        $plan = $cycle->plan;
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "📦 Ciclo #" . $cycle->id . "\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        
        // Usuário
        echo "👤 Usuário: " . ($user ? $user->name : 'N/A') . " (ID: " . $cycle->user_id . ")\n";
        echo "   Email: " . ($user ? $user->email : 'N/A') . "\n\n";
        
        // Plano
        echo "📋 Plano: " . ($plan ? $plan->name : 'N/A') . "\n";
        echo "   Tipo: " . $cycle->type . "\n";
        echo "   Duração: {$cycle->duration_days} dias\n\n";
        
        // Datas
        $startedAt = $cycle->started_at ? Carbon::parse($cycle->started_at)->setTimezone(config('app.timezone')) : null;
        $endsAt = $cycle->ends_at ? Carbon::parse($cycle->ends_at)->setTimezone(config('app.timezone')) : null;
        
        echo "📅 Datas:\n";
        echo "   Início: " . ($startedAt ? $startedAt->format('d/m/Y H:i:s') : 'N/A') . "\n";
        echo "   Fim previsto: " . ($endsAt ? $endsAt->format('d/m/Y H:i:s') : 'N/A') . "\n";
        
        if ($endsAt) {
            $hoursUntil = $now->diffInHours($endsAt, false);
            $daysUntil = $now->diffInDays($endsAt, false);
            echo "   ⏰ Vence em: {$daysUntil} dia(s) e " . ($hoursUntil % 24) . " hora(s)\n";
        }
        echo "\n";
        
        // Progresso
        echo "📊 Progresso:\n";
        echo "   Dias pagos: {$cycle->days_paid} / {$cycle->duration_days}\n";
        $percentage = $cycle->duration_days > 0 ? round(($cycle->days_paid / $cycle->duration_days) * 100, 2) : 0;
        echo "   Percentual: {$percentage}%\n";
        echo "   Falta: " . ($cycle->duration_days - $cycle->days_paid) . " dia(s)\n\n";
        
        // Valores
        echo "💰 Valores:\n";
        echo "   Investido: R$ " . number_format($cycle->amount, 2, ',', '.') . "\n";
        echo "   Renda diária: R$ " . number_format($cycle->daily_income ?? 0, 2, ',', '.') . "\n";
        echo "   Retorno total: R$ " . number_format($cycle->total_return, 2, ',', '.') . "\n";
        echo "   Total pago: R$ " . number_format($cycle->total_paid, 2, ',', '.') . "\n";
        
        $pending = $cycle->total_return - $cycle->total_paid;
        echo "   Pendente: R$ " . number_format($pending, 2, ',', '.') . "\n\n";
        
        $totalPending += $pending;
        
        // Motivo do vencimento
        echo "🎯 Por que vai finalizar neste dia:\n";
        $reasons = [];
        
        if ($endsAt && $endsAt->isSameDay($date)) {
            $reasons[] = "✓ Data de término (ends_at) é " . $date->format('d/m/Y');
        }
        
        $daysRemaining = $cycle->duration_days - $cycle->days_paid;
        if ($daysRemaining <= 1) {
            $reasons[] = "✓ Falta apenas {$daysRemaining} dia(s) para completar: {$cycle->days_paid}/{$cycle->duration_days}";
        }
        
        if (empty($reasons)) {
            $reasons[] = "? Motivo indefinido (verificar lógica)";
        }
        
        foreach ($reasons as $reason) {
            echo "   {$reason}\n";
        }
        
        echo "\n";
    }
    
    echo "💵 RESUMO DO DIA " . $date->format('d/m/Y') . "\n";
    echo "-------------------------------------------\n";
    echo "Ciclos a finalizar: " . $cycles->count() . "\n";
    echo "Valor total pendente: R$ " . number_format($totalPending, 2, ',', '.') . "\n\n";
}

echo "\n==========================================\n";
echo "📊 RESUMO GERAL\n";
echo "==========================================\n\n";

// Resumo total
$total21 = Cycle::where('status', 'ACTIVE')
    ->whereNotNull('ends_at')
    ->whereDate('ends_at', $now->copy()->addDay()->toDateString())
    ->count();

$total22 = Cycle::where('status', 'ACTIVE')
    ->whereNotNull('ends_at')
    ->whereDate('ends_at', $now->copy()->addDays(2)->toDateString())
    ->count();

$pending21 = Cycle::where('status', 'ACTIVE')
    ->whereNotNull('ends_at')
    ->whereDate('ends_at', $now->copy()->addDay()->toDateString())
    ->get()
    ->sum(function($cycle) {
        return $cycle->total_return - $cycle->total_paid;
    });

$pending22 = Cycle::where('status', 'ACTIVE')
    ->whereNotNull('ends_at')
    ->whereDate('ends_at', $now->copy()->addDays(2)->toDateString())
    ->get()
    ->sum(function($cycle) {
        return $cycle->total_return - $cycle->total_paid;
    });

echo "📅 Dia 21/11 (Sexta): {$total21} ciclos | R$ " . number_format($pending21, 2, ',', '.') . "\n";
echo "📅 Dia 22/11 (Sábado): {$total22} ciclos | R$ " . number_format($pending22, 2, ',', '.') . "\n\n";

echo "💰 Total geral: " . ($total21 + $total22) . " ciclos | R$ " . number_format($pending21 + $pending22, 2, ',', '.') . "\n\n";

echo "✅ Análise concluída!\n\n";

