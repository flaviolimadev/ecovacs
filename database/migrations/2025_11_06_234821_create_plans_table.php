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
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nome do plano
            $table->string('image'); // Caminho da imagem
            $table->decimal('price', 18, 2); // Valor do plano
            $table->decimal('daily_income', 18, 2)->nullable(); // Renda diária (null para planos ciclo)
            $table->integer('duration_days'); // Duração em dias
            $table->decimal('total_return', 18, 2); // Retorno total
            $table->integer('max_purchases')->default(1); // Máximo de compras simultâneas (0 = ilimitado)
            $table->enum('type', ['DAILY', 'END_CYCLE'])->default('DAILY'); // Tipo: diário ou fim de ciclo
            $table->text('description')->nullable(); // Descrição adicional
            $table->boolean('is_active')->default(true); // Plano ativo
            $table->integer('order')->default(0); // Ordem de exibição
            $table->timestamps();
            
            // Índices
            $table->index('is_active');
            $table->index('type');
            $table->index('order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
