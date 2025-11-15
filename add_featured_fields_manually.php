<?php

/**
 * Script para adicionar campos de promoção na tabela plans
 * Execute: php add_featured_fields_manually.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

try {
    echo "=== Adicionando campos de promoção na tabela plans ===\n\n";

    // Verificar se as colunas já existem
    $columns = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'plans'");
    $existingColumns = array_column($columns, 'column_name');

    if (in_array('is_featured', $existingColumns)) {
        echo "✅ Campos de promoção já existem na tabela plans.\n";
        exit(0);
    }

    echo "1. Adicionando coluna is_featured...\n";
    DB::statement("ALTER TABLE plans ADD COLUMN is_featured BOOLEAN DEFAULT false NOT NULL");
    DB::statement("ALTER TABLE plans ALTER COLUMN is_featured SET DEFAULT false");
    echo "   ✅ Coluna is_featured adicionada\n\n";

    echo "2. Adicionando coluna featured_color...\n";
    DB::statement("ALTER TABLE plans ADD COLUMN featured_color VARCHAR(7) NULL");
    echo "   ✅ Coluna featured_color adicionada\n\n";

    echo "3. Adicionando coluna featured_ends_at...\n";
    DB::statement("ALTER TABLE plans ADD COLUMN featured_ends_at TIMESTAMP NULL");
    echo "   ✅ Coluna featured_ends_at adicionada\n\n";

    echo "4. Criando índices...\n";
    try {
        DB::statement("CREATE INDEX plans_is_featured_index ON plans (is_featured)");
        echo "   ✅ Índice plans_is_featured_index criado\n";
    } catch (\Exception $e) {
        echo "   ⚠️  Índice plans_is_featured_index já existe ou erro: " . $e->getMessage() . "\n";
    }

    try {
        DB::statement("CREATE INDEX plans_featured_ends_at_index ON plans (featured_ends_at)");
        echo "   ✅ Índice plans_featured_ends_at_index criado\n";
    } catch (\Exception $e) {
        echo "   ⚠️  Índice plans_featured_ends_at_index já existe ou erro: " . $e->getMessage() . "\n";
    }

    echo "\n=== ✅ Campos de promoção adicionados com sucesso! ===\n";
    echo "\nAgora você pode usar a funcionalidade de planos em promoção no admin.\n";

} catch (\Exception $e) {
    echo "\n❌ Erro: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}

