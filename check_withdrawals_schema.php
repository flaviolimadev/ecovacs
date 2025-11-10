#!/usr/bin/env php
<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "📋 VERIFICANDO SCHEMA DA TABELA WITHDRAWALS\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "\n";

try {
    $columns = DB::select("
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'withdrawals' 
        ORDER BY ordinal_position
    ");
    
    echo "Colunas encontradas:\n";
    echo "─────────────────────────────────────────────────────────\n";
    
    $hasRawResponse = false;
    $hasErrorMessage = false;
    
    foreach ($columns as $col) {
        $nullable = $col->is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
        echo sprintf("  %-30s %-20s %s\n", $col->column_name, $col->data_type, $nullable);
        
        if ($col->column_name === 'raw_response') $hasRawResponse = true;
        if ($col->column_name === 'error_message') $hasErrorMessage = true;
    }
    
    echo "─────────────────────────────────────────────────────────\n";
    echo "\n";
    
    echo "✅ Status dos campos necessários:\n";
    echo "   raw_response: " . ($hasRawResponse ? '✅ EXISTE' : '❌ NÃO EXISTE') . "\n";
    echo "   error_message: " . ($hasErrorMessage ? '✅ EXISTE' : '❌ NÃO EXISTE') . "\n";
    echo "\n";
    
    if (!$hasRawResponse || !$hasErrorMessage) {
        echo "⚠️  ATENÇÃO: Campos faltando!\n";
        echo "\n";
        echo "Execute a migration:\n";
        echo "   php artisan migrate\n";
        echo "\n";
    } else {
        echo "✅ Todos os campos necessários existem!\n";
        echo "\n";
    }
    
} catch (\Exception $e) {
    echo "❌ ERRO: " . $e->getMessage() . "\n";
    echo "\n";
}

echo "═══════════════════════════════════════════════════════════\n";
echo "\n";

