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
        Schema::table('withdrawals', function (Blueprint $table) {
            if (!Schema::hasColumn('withdrawals', 'raw_response')) {
                $table->jsonb('raw_response')->nullable()->after('transaction_id');
            }
            if (!Schema::hasColumn('withdrawals', 'error_message')) {
                $table->text('error_message')->nullable()->after('raw_response');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropColumn(['raw_response', 'error_message']);
        });
    }
};
