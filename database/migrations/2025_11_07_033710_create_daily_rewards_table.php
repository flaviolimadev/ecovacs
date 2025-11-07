<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('daily_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('claim_date'); // Data do claim
            $table->decimal('amount', 18, 2)->default(0.50); // Valor do prêmio (R$ 0,50)
            $table->timestamps();

            // Índices
            $table->index('user_id');
            $table->index('claim_date');
            
            // Garantir 1 claim por dia por usuário
            $table->unique(['user_id', 'claim_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_rewards');
    }
};
