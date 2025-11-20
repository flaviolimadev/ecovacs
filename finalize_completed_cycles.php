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
        
        // Verificar se há valor a ser creditado ao finalizar
        $remainingPayment = 0;
        $description = '';
        
        if ($cycle->type === 'END_CYCLE') {
            // Ciclo END_CYCLE: creditar o retorno total se ainda não foi pago
            if ($cycle->total_paid < $cycle->total_return) {
                $remainingPayment = $cycle->total_return - $cycle->total_paid;
                $description = sprintf(
                    'Ciclo #%d finalizado - Retorno total do plano "%s"',
                    $cycle->id,
                    $plan ? $plan->name : 'N/A'
                );
            }
        } else {
            // Ciclo DAILY: verificar se há algum valor pendente
            // (geralmente já foi pago durante os dias, mas verificar mesmo assim)
            $expectedTotal = $cycle->daily_income * $cycle->duration_days;
            if ($cycle->total_paid < $expectedTotal) {
                $remainingPayment = $expectedTotal - $cycle->total_paid;
                $description = sprintf(
                    'Ciclo #%d finalizado - Ajuste de rendimentos do plano "%s"',
                    $cycle->id,
                    $plan ? $plan->name : 'N/A'
                );
            }
        }
        
        if ($remainingPayment > 0) {
            // Obter saldo antes para registrar no ledger
            $balanceBefore = $user->balance_withdrawn;
            
            // Creditar o valor restante no saldo do usuário
            $user->increment('balance_withdrawn', $remainingPayment);
            $user->increment('total_earned', $remainingPayment);
            
            // Atualizar o ciclo
            $cycle->increment('total_paid', $remainingPayment);
            
            // Obter saldo depois
            $user->refresh();
            $balanceAfter = $user->balance_withdrawn;
            
            // Registrar no ledger com informações completas
            \App\Models\Ledger::create([
                'user_id' => $user->id,
                'type' => 'EARNING',
                'reference_type' => Cycle::class,
                'reference_id' => $cycle->id,
                'description' => $description,
                'amount' => $remainingPayment,
                'operation' => 'CREDIT',
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
            ]);
            
            echo "💰 Ciclo #{$cycle->id}: Creditado R$ " . number_format($remainingPayment, 2, ',', '.') . " (retorno final)\n";
        } else {
            // Mesmo sem pagamento adicional, criar registro no ledger informando a finalização
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
            
            echo "ℹ️  Ciclo #{$cycle->id}: Finalizado (todos os pagamentos já foram realizados)\n";
        }
        
        // Finalizar o ciclo
        $cycle->status = 'FINISHED';
        $cycle->save();
        
        DB::commit();
        
        $finalized++;
        
        echo "✅ Ciclo #{$cycle->id} finalizado - Usuário: {$user->name} - Plano: " . ($plan ? $plan->name : 'N/A') . "\n";
        
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

