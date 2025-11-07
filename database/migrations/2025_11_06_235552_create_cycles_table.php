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
        Schema::create('cycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_id')->constrained()->onDelete('restrict');
            $table->decimal('amount', 18, 2); // Valor investido
            $table->enum('type', ['DAILY', 'END_CYCLE']); // Tipo do ciclo
            $table->integer('duration_days'); // Duração em dias
            $table->timestamp('started_at'); // Data de início
            $table->timestamp('ends_at'); // Data de término
            $table->enum('status', ['ACTIVE', 'FINISHED', 'CANCELLED'])->default('ACTIVE');
            $table->boolean('is_first_purchase')->default(false); // Primeira compra do usuário?
            $table->decimal('daily_income', 18, 2)->nullable(); // Renda diária (null para END_CYCLE)
            $table->decimal('total_return', 18, 2); // Retorno total esperado
            $table->decimal('total_paid', 18, 2)->default(0); // Total já pago
            $table->integer('days_paid')->default(0); // Dias já pagos
            $table->timestamp('last_payment_at')->nullable(); // Última data de pagamento
            $table->timestamps();
            
            // Índices
            $table->index('user_id');
            $table->index('plan_id');
            $table->index('status');
            $table->index('type');
            $table->index(['status', 'ends_at']); // Para buscar ciclos que precisam ser finalizados
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cycles');
    }
};
