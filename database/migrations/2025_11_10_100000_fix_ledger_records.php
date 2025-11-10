<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Adicionar operation='CREDIT' onde está NULL
        DB::table('ledger')
            ->whereNull('operation')
            ->update(['operation' => 'CREDIT']);

        // Corrigir reference_type para registros de WITHDRAWAL que possam estar com valor errado
        DB::table('ledger')
            ->where('type', 'WITHDRAWAL')
            ->where(function($query) {
                $query->whereNull('reference_type')
                      ->orWhere('reference_type', '!=', 'App\\Models\\Withdrawal');
            })
            ->update(['reference_type' => 'App\\Models\\Withdrawal']);

        // Corrigir reference_type para registros de DEPOSIT
        DB::table('ledger')
            ->where('type', 'DEPOSIT')
            ->where(function($query) {
                $query->whereNull('reference_type')
                      ->orWhere('reference_type', 'DEPOSIT');
            })
            ->update(['reference_type' => 'App\\Models\\Deposit']);

        // Corrigir reference_type para registros de INVESTMENT
        DB::table('ledger')
            ->where('type', 'INVESTMENT')
            ->whereNull('reference_type')
            ->update(['reference_type' => 'App\\Models\\Cycle']);

        // Corrigir reference_type para registros de COMMISSION
        DB::table('ledger')
            ->where('type', 'COMMISSION')
            ->whereNull('reference_type')
            ->update(['reference_type' => 'App\\Models\\Commission']);

        // Corrigir reference_type para registros de DAILY_REWARD
        DB::table('ledger')
            ->where('type', 'DAILY_REWARD')
            ->whereNull('reference_type')
            ->update(['reference_type' => 'App\\Models\\DailyReward']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Não há necessidade de reverter
    }
};

