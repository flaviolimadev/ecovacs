<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->index(); // vizzion, outro_provedor, etc.
            $table->string('event')->nullable()->index(); // TRANSACTION_PAID, etc.
            $table->string('external_id')->nullable()->index(); // ID da transação no provedor
            $table->string('idempotency_hash', 64)->unique(); // hash SHA256 do payload
            $table->json('headers')->nullable(); // headers HTTP recebidos
            $table->json('payload'); // payload bruto do webhook
            $table->enum('status', ['received', 'processed', 'failed'])->default('received');
            $table->foreignId('deposit_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamp('processed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['provider', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
    }
};

