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
        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Quem recebeu a comissão
            $table->foreignId('from_user_id')->constrained('users')->onDelete('cascade'); // Quem fez a compra
            $table->foreignId('cycle_id')->constrained()->onDelete('cascade'); // Ciclo que gerou a comissão
            $table->integer('level'); // Nível na árvore (1, 2, 3)
            $table->decimal('amount', 18, 2); // Valor da comissão
            $table->decimal('purchase_amount', 18, 2); // Valor da compra que gerou a comissão
            $table->decimal('percentage', 5, 2); // Percentual aplicado (15.00, 8.00, 2.00, 1.00)
            $table->enum('type', ['FIRST_PURCHASE', 'SUBSEQUENT_PURCHASE']); // Tipo de comissão
            $table->text('description')->nullable(); // Descrição para extrato
            $table->timestamps();
            
            // Índices
            $table->index('user_id');
            $table->index('from_user_id');
            $table->index('cycle_id');
            $table->index('level');
            $table->index('type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};
