<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Remover o check constraint antigo
        DB::statement("ALTER TABLE webhook_events DROP CONSTRAINT IF EXISTS webhook_events_status_check");
        
        // Adicionar novo check constraint com os novos valores
        DB::statement("
            ALTER TABLE webhook_events 
            ADD CONSTRAINT webhook_events_status_check 
            CHECK (status::text = ANY (ARRAY[
                'received'::text, 
                'processed'::text, 
                'failed'::text, 
                'manual_pending_webhook'::text, 
                'manual_webhook_arrived'::text, 
                'late_arrival'::text
            ]))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Voltar ao constraint original
        DB::statement("
            ALTER TABLE webhook_events 
            DROP CONSTRAINT IF EXISTS webhook_events_status_check
        ");
        
        DB::statement("
            ALTER TABLE webhook_events 
            ADD CONSTRAINT webhook_events_status_check 
            CHECK (status IN ('received', 'processed', 'failed'))
        ");
    }
};
