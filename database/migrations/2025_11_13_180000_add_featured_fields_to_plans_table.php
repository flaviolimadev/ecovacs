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
        Schema::table('plans', function (Blueprint $table) {
            $table->boolean('is_featured')->default(false)->after('is_active');
            $table->string('featured_color', 7)->nullable()->after('is_featured'); // Cor em hex (#RRGGBB)
            $table->timestamp('featured_ends_at')->nullable()->after('featured_color');
            
            // Índices para melhor performance
            $table->index('is_featured');
            $table->index('featured_ends_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropIndex(['is_featured']);
            $table->dropIndex(['featured_ends_at']);
            $table->dropColumn(['is_featured', 'featured_color', 'featured_ends_at']);
        });
    }
};

