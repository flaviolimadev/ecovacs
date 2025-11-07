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
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Usuário que indicou
            $table->foreignId('referred_user_id')->constrained('users')->onDelete('cascade'); // Usuário indicado
            $table->integer('level')->default(1); // Nível na árvore (1, 2, 3...)
            $table->timestamps();
            
            // Índices para performance
            $table->index('user_id');
            $table->index('referred_user_id');
            $table->index('level');
            
            // Evitar duplicatas
            $table->unique(['user_id', 'referred_user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
