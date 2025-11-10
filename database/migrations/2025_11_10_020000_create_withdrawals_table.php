<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 18, 2); // Valor total debitado do usuário
            $table->decimal('fee_amount', 18, 2); // Taxa cobrada
            $table->decimal('net_amount', 18, 2); // Valor líquido que o usuário recebe
            $table->string('cpf', 14);
            $table->string('pix_key');
            $table->enum('pix_key_type', ['cpf', 'email', 'phone', 'random']);
            $table->enum('status', ['REQUESTED', 'APPROVED', 'PROCESSING', 'PAID', 'REJECTED', 'CANCELLED'])->default('REQUESTED');
            $table->string('transaction_id')->nullable(); // ID da transação no provedor
            $table->text('rejection_reason')->nullable();
            $table->json('provider_response')->nullable();
            $table->timestamp('requested_at');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
            $table->index(['user_id', 'requested_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};

