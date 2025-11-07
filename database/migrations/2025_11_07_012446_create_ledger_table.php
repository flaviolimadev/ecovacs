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
        Schema::create('ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // INVESTMENT, EARNING, COMMISSION, WITHDRAWAL, DEPOSIT
            $table->morphs('reference'); // reference_type, reference_id (polimórfico)
            $table->text('description');
            $table->decimal('amount', 18, 2);
            $table->enum('operation', ['CREDIT', 'DEBIT'])->default('CREDIT');
            $table->decimal('balance_before', 18, 2)->nullable();
            $table->decimal('balance_after', 18, 2)->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('type');
            $table->index('created_at');
            // morphs() já cria índice automaticamente
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ledger');
    }
};
