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
        Schema::create('earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cycle_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('reference_date'); // Data de referência do rendimento
            $table->decimal('value', 18, 2);
            $table->enum('type', ['DAILY', 'END_LUMP_SUM', 'CAPITAL_RETURN'])->default('DAILY');
            $table->boolean('is_paid')->default(false);
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('cycle_id');
            $table->index('user_id');
            $table->index('reference_date');
            $table->index('type');
            $table->index('is_paid');
            $table->unique(['cycle_id', 'reference_date', 'type']); // Evita duplicatas
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('earnings');
    }
};
