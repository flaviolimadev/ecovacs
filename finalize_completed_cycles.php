<?php

/**
 * Script para Finalizar Ciclos Completados
 * 
 * Finaliza automaticamente os ciclos que:
 * 1. Já completaram todos os dias pagos (days_paid >= duration_days)
 * 2. Já passaram da data de término (ends_at < now)
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cycle;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

// Configurar timezone do Brasil
date_default_timezone_set(config('app.timezone'));
Carbon::setLocale('pt_BR');

echo "\n";
echo "=============================================\n";
echo "  FINALIZAÇÃO DE CICLOS COMPLETADOS\n";
echo "=============================================\n\n";

$now = Carbon::now(config('app.timezone'));
$finalized = 0;
$errors = 0;

// Buscar ciclos ativos que deveriam estar finalizados
$cyclesToFinalize = Cycle::where('status', 'ACTIVE')
    ->where(function ($query) use ($now) {
        // Ciclos que completaram todos os dias
        $query->whereRaw('days_paid >= duration_days')
            // OU ciclos que passaram da data de término
            ->orWhere(function ($q) use ($now) {
                $q->whereNotNull('ends_at')
                  ->where('ends_at', '<', $now);
            });
    })
    ->with(['user', 'plan'])
    ->get();

echo "📊 Encontrados " . $cyclesToFinalize->count() . " ciclos para finalizar\n\n";

if ($cyclesToFinalize->count() === 0) {
    echo "✅ Nenhum ciclo precisa ser finalizado!\n\n";
    exit(0);
}

echo "Iniciando finalização...\n\n";

foreach ($cyclesToFinalize as $cycle) {
    try {
        DB::beginTransaction();
        
        $user = $cycle->user;
        $plan = $cycle->plan;
        
        // =====================================================
        // IMPORTANTE: Não adicionar nenhum valor aos saldos!
        // =====================================================
        // Os ciclos já receberam tudo que tinham para receber
        // através dos pagamentos diários. Aqui apenas finalizamos
        // o ciclo mudando o status para FINISHED.
        // =====================================================
        
        // Registrar no ledger informando a finalização (sem valor)
        \App\Models\Ledger::create([
            'user_id' => $user->id,
            'type' => 'EARNING',
            'reference_type' => Cycle::class,
            'reference_id' => $cycle->id,
            'description' => sprintf(
                'Ciclo #%d finalizado - Plano "%s" (todos os pagamentos já foram realizados)',
                $cycle->id,
                $plan ? $plan->name : 'N/A'
            ),
            'amount' => 0,
            'operation' => 'CREDIT',
            'balance_before' => $user->balance_withdrawn,
            'balance_after' => $user->balance_withdrawn,
        ]);
        
        // Finalizar o ciclo (sem adicionar nada aos saldos)
        $cycle->status = 'FINISHED';
        $cycle->save();
        
        DB::commit();
        
        $finalized++;
        
        echo "✅ Ciclo #{$cycle->id} finalizado - Usuário: {$user->name} - Plano: " . ($plan ? $plan->name : 'N/A') . "\n";
        echo "   Dias pagos: {$cycle->days_paid}/{$cycle->duration_days} - Total pago: R$ " . number_format($cycle->total_paid, 2, ',', '.') . "\n";
        
    } catch (\Exception $e) {
        DB::rollBack();
        $errors++;
        
        echo "❌ Erro ao finalizar ciclo #{$cycle->id}: " . $e->getMessage() . "\n";
    }
}

echo "\n";
echo "=============================================\n";
echo "  RESUMO\n";
echo "=============================================\n\n";

echo "✅ Ciclos finalizados com sucesso: {$finalized}\n";
echo "❌ Erros: {$errors}\n";
echo "\n";

if ($finalized > 0) {
    echo "💡 Execute o script de análise novamente para verificar:\n";
    echo "   php analyze_finished_cycles.php\n";
}

echo "\n";

