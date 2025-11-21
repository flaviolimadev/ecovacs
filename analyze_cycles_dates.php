<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Cycle;
use App\Models\Plan;
use App\Models\User;
use Carbon\Carbon;

echo "=============================================\n";
echo "  ANÁLISE DE CICLOS - VENCIMENTOS\n";
echo "  Data da análise: " . Carbon::now(config('app.timezone'))->format('d/m/Y H:i:s') . "\n";
echo "=============================================\n\n";

$now = Carbon::now(config('app.timezone'));
$today = $now->copy()->startOfDay();
$todayEnd = $now->copy()->endOfDay();
$tomorrow = $now->copy()->addDay()->startOfDay();
$tomorrowEnd = $now->copy()->addDay()->endOfDay();

echo "🕐 Timezone: " . config('app.timezone') . "\n";
echo "📅 Hoje: " . $today->format('d/m/Y (l)') . "\n";
echo "📅 Amanhã: " . $tomorrow->format('d/m/Y (l)') . "\n\n";

// ==========================================
// 1. CICLOS QUE DEVERIAM VENCER HOJE (20/11)
// ==========================================

echo "==========================================\n";
echo "🔴 CICLOS QUE DEVERIAM VENCER HOJE (20/11)\n";
echo "==========================================\n\n";

$cyclesTodayByEndsAt = Cycle::where('status', 'ACTIVE')
    ->whereNotNull('ends_at')
    ->whereDate('ends_at', $today->toDateString())
    ->with(['user', 'plan'])
    ->orderBy('ends_at')
    ->get();

$cyclesTodayByDuration = Cycle::where('status', 'ACTIVE')
    ->whereRaw('days_paid >= duration_days')
    ->with(['user', 'plan'])
    ->orderBy('started_at')
    ->get();

// Combinar ambos (evitar duplicatas)
$cyclesToday = $cyclesTodayByEndsAt->merge($cyclesTodayByDuration)->unique('id');

if ($cyclesToday->isEmpty()) {
    echo "✅ Nenhum ciclo deveria vencer hoje.\n\n";
} else {
    echo "Total: " . $cyclesToday->count() . " ciclos\n\n";
    
    foreach ($cyclesToday as $cycle) {
        $user = $cycle->user;
        $plan = $cycle->plan;
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "📦 Ciclo #" . $cycle->id . "\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        
        // Usuário
        echo "👤 Usuário: {$user->name} (ID: {$user->id})\n";
        echo "   Email: {$user->email}\n\n";
        
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
            $diffFromNow = $now->diffInHours($endsAt, false);
            if ($diffFromNow < 0) {
                echo "   ⚠️  ATRASADO há " . abs($diffFromNow) . " horas\n";
            } else {
                echo "   ⏰ Vence em " . $diffFromNow . " horas\n";
            }
        }
        echo "\n";
        
        // Progresso
        echo "📊 Progresso:\n";
        echo "   Dias pagos: {$cycle->days_paid} / {$cycle->duration_days}\n";
        $percentage = $cycle->duration_days > 0 ? round(($cycle->days_paid / $cycle->duration_days) * 100, 2) : 0;
        echo "   Percentual: {$percentage}%\n\n";
        
        // Valores
        echo "💰 Valores:\n";
        echo "   Investido: R$ " . number_format($cycle->amount, 2, ',', '.') . "\n";
        echo "   Renda diária: R$ " . number_format($cycle->daily_income ?? 0, 2, ',', '.') . "\n";
        echo "   Retorno total: R$ " . number_format($cycle->total_return, 2, ',', '.') . "\n";
        echo "   Total pago: R$ " . number_format($cycle->total_paid, 2, ',', '.') . "\n";
        
        $pending = $cycle->total_return - $cycle->total_paid;
        echo "   Pendente: R$ " . number_format($pending, 2, ',', '.') . "\n\n";
        
        // Motivo do vencimento
        echo "🎯 Motivo do vencimento hoje:\n";
        $reasons = [];
        
        if ($endsAt && $endsAt->isSameDay($today)) {
            $reasons[] = "✓ Data de término (ends_at) é hoje: " . $endsAt->format('d/m/Y');
        }
        
        if ($cycle->days_paid >= $cycle->duration_days) {
            $reasons[] = "✓ Completou todos os dias: {$cycle->days_paid}/{$cycle->duration_days}";
        }
        
        if (empty($reasons)) {
            $reasons[] = "? Motivo indefinido (verificar lógica)";
        }
        
        foreach ($reasons as $reason) {
            echo "   {$reason}\n";
        }
        
        echo "\n";
        
        // Ação recomendada
        echo "💡 Ação recomendada:\n";
        if ($pending > 0.01) {
            echo "   ⚠️  FINALIZAR e creditar R$ " . number_format($pending, 2, ',', '.') . "\n";
        } else {
            echo "   ℹ️  FINALIZAR (sem valores pendentes)\n";
        }
        
        echo "\n";
    }
}

// ==========================================
// 2. CICLOS QUE VÃO VENCER AMANHÃ (21/11)
// ==========================================

echo "\n==========================================\n";
echo "🟡 CICLOS QUE VÃO VENCER AMANHÃ (21/11)\n";
echo "==========================================\n\n";

$cyclesTomorrowByEndsAt = Cycle::where('status', 'ACTIVE')
    ->whereNotNull('ends_at')
    ->whereDate('ends_at', $tomorrow->toDateString())
    ->with(['user', 'plan'])
    ->orderBy('ends_at')
    ->get();

// Ciclos que vão completar duração amanhã
$cyclesTomorrowByDuration = Cycle::where('status', 'ACTIVE')
    ->whereRaw('days_paid = duration_days - 1')
    ->with(['user', 'plan'])
    ->orderBy('started_at')
    ->get();

// Combinar ambos (evitar duplicatas)
$cyclesTomorrow = $cyclesTomorrowByEndsAt->merge($cyclesTomorrowByDuration)->unique('id');

if ($cyclesTomorrow->isEmpty()) {
    echo "✅ Nenhum ciclo vai vencer amanhã.\n\n";
} else {
    echo "Total: " . $cyclesTomorrow->count() . " ciclos\n\n";
    
    foreach ($cyclesTomorrow as $cycle) {
        $user = $cycle->user;
        $plan = $cycle->plan;
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "📦 Ciclo #" . $cycle->id . "\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        
        // Usuário
        echo "👤 Usuário: {$user->name} (ID: {$user->id})\n";
        echo "   Email: {$user->email}\n\n";
        
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
            echo "   ⏰ Vence em " . abs($hoursUntil) . " horas\n";
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
        
        // Motivo do vencimento amanhã
        echo "🎯 Motivo do vencimento amanhã:\n";
        $reasons = [];
        
        if ($endsAt && $endsAt->isSameDay($tomorrow)) {
            $reasons[] = "✓ Data de término (ends_at) é amanhã: " . $endsAt->format('d/m/Y');
        }
        
        if ($cycle->days_paid == $cycle->duration_days - 1) {
            $reasons[] = "✓ Falta 1 dia para completar: {$cycle->days_paid}/{$cycle->duration_days}";
        }
        
        if (empty($reasons)) {
            $reasons[] = "? Motivo indefinido (verificar lógica)";
        }
        
        foreach ($reasons as $reason) {
            echo "   {$reason}\n";
        }
        
        echo "\n";
    }
}

// ==========================================
// RESUMO GERAL
// ==========================================

echo "\n==========================================\n";
echo "📊 RESUMO GERAL\n";
echo "==========================================\n\n";

$totalToday = $cyclesToday->count();
$totalTomorrow = $cyclesTomorrow->count();
$pendingToday = $cyclesToday->sum(function($cycle) {
    return $cycle->total_return - $cycle->total_paid;
});
$pendingTomorrow = $cyclesTomorrow->sum(function($cycle) {
    return $cycle->total_return - $cycle->total_paid;
});

echo "📅 Hoje (20/11):\n";
echo "   Ciclos para finalizar: {$totalToday}\n";
echo "   Valor total pendente: R$ " . number_format($pendingToday, 2, ',', '.') . "\n\n";

echo "📅 Amanhã (21/11):\n";
echo "   Ciclos que vão vencer: {$totalTomorrow}\n";
echo "   Valor total pendente: R$ " . number_format($pendingTomorrow, 2, ',', '.') . "\n\n";

echo "💰 Total geral pendente: R$ " . number_format($pendingToday + $pendingTomorrow, 2, ',', '.') . "\n\n";

// ==========================================
// OBSERVAÇÕES
// ==========================================

echo "==========================================\n";
echo "📝 OBSERVAÇÕES\n";
echo "==========================================\n\n";

echo "ℹ️  Esta é apenas uma ANÁLISE.\n";
echo "ℹ️  Nenhum ciclo foi finalizado automaticamente.\n";
echo "ℹ️  Para finalizar, use o script 'finalize_completed_cycles.php'.\n\n";

echo "⚠️  Ciclos atrasados devem ser finalizados o quanto antes.\n";
echo "⚠️  Ciclos de amanhã serão finalizados automaticamente no próximo job.\n\n";

echo "✅ Análise concluída em " . Carbon::now(config('app.timezone'))->format('d/m/Y H:i:s') . "\n\n";

