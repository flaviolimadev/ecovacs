<?php

/**
 * Script para verificar se as colunas de promoção existem
 * Execute: php check_featured_columns.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "=== Verificando colunas de promoção na tabela plans ===\n\n";

try {
    $columns = DB::select("SELECT column_name, data_type, is_nullable, column_default 
                           FROM information_schema.columns 
                           WHERE table_name = 'plans' 
                           AND column_name IN ('is_featured', 'featured_color', 'featured_ends_at')
                           ORDER BY column_name");

    if (empty($columns)) {
        echo "❌ Nenhuma coluna de promoção encontrada.\n";
        echo "Execute: php add_featured_fields_manually.php\n";
        exit(1);
    }

    echo "✅ Colunas encontradas:\n";
    foreach ($columns as $column) {
        echo "   - {$column->column_name} ({$column->data_type})\n";
    }

    // Verificar índices
    echo "\n=== Verificando índices ===\n";
    $indexes = DB::select("SELECT indexname 
                           FROM pg_indexes 
                           WHERE tablename = 'plans' 
                           AND indexname IN ('plans_is_featured_index', 'plans_featured_ends_at_index')");

    if (empty($indexes)) {
        echo "⚠️  Índices não encontrados.\n";
    } else {
        echo "✅ Índices encontrados:\n";
        foreach ($indexes as $index) {
            echo "   - {$index->indexname}\n";
        }
    }

    echo "\n✅ Tudo OK! As colunas de promoção estão configuradas.\n";

} catch (\Exception $e) {
    echo "\n❌ Erro: " . $e->getMessage() . "\n";
    exit(1);
}

