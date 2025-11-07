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
        Schema::table('users', function (Blueprint $table) {
            // Adiciona coluna balance_withdrawn (saldo disponível para saque)
            // balance = saldo investido (usado para comprar pacotes)
            // balance_withdrawn = saldo disponível para saque (pode ser sacado)
            $table->decimal('balance_withdrawn', 18, 2)->default(0)->after('balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('balance_withdrawn');
        });
    }
};
