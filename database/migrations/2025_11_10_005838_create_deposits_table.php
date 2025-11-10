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
        Schema::create('deposits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 18, 2);
            $table->string('transaction_id')->nullable()->unique();
            $table->string('order_id')->nullable();
            $table->enum('status', ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED'])->default('PENDING');
            $table->text('qr_code')->nullable();
            $table->text('qr_code_base64')->nullable();
            $table->text('qr_code_image')->nullable();
            $table->string('order_url')->nullable();
            $table->json('raw_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
            $table->index('transaction_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deposits');
    }
};
