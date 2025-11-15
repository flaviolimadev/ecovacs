#!/bin/bash

# Script para adicionar campos de promoção na tabela plans
# Execute: bash APPLY_FEATURED_FIELDS.sh

cd /app

echo "=== Verificando se as colunas já existem ==="

# Verificar se is_featured já existe
if php artisan tinker --execute="echo Schema::hasColumn('plans', 'is_featured') ? 'SIM' : 'NAO';" 2>/dev/null | grep -q "SIM"; then
    echo "✅ Campos de promoção já existem na tabela plans."
    exit 0
fi

echo ""
echo "=== Adicionando campos de promoção ==="
echo ""

# Criar migration temporária
php artisan make:migration add_featured_fields_to_plans_table_temp --path=database/migrations 2>/dev/null || true

# Aplicar via SQL direto
php artisan tinker << 'EOF'
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

try {
    echo "1. Adicionando coluna is_featured...\n";
    DB::statement("ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL");
    echo "   ✅ Coluna is_featured adicionada\n\n";

    echo "2. Adicionando coluna featured_color...\n";
    DB::statement("ALTER TABLE plans ADD COLUMN IF NOT EXISTS featured_color VARCHAR(7) NULL");
    echo "   ✅ Coluna featured_color adicionada\n\n";

    echo "3. Adicionando coluna featured_ends_at...\n";
    DB::statement("ALTER TABLE plans ADD COLUMN IF NOT EXISTS featured_ends_at TIMESTAMP NULL");
    echo "   ✅ Coluna featured_ends_at adicionada\n\n";

    echo "4. Criando índices...\n";
    try {
        DB::statement("CREATE INDEX IF NOT EXISTS plans_is_featured_index ON plans (is_featured)");
        echo "   ✅ Índice plans_is_featured_index criado\n";
    } catch (\Exception $e) {
        echo "   ⚠️  Índice já existe ou erro: " . $e->getMessage() . "\n";
    }

    try {
        DB::statement("CREATE INDEX IF NOT EXISTS plans_featured_ends_at_index ON plans (featured_ends_at)");
        echo "   ✅ Índice plans_featured_ends_at_index criado\n";
    } catch (\Exception $e) {
        echo "   ⚠️  Índice já existe ou erro: " . $e->getMessage() . "\n";
    }

    echo "\n=== ✅ Campos de promoção adicionados com sucesso! ===\n";
} catch (\Exception $e) {
    echo "\n❌ Erro: " . $e->getMessage() . "\n";
    exit(1);
}
EOF

echo ""
echo "✅ Processo concluído!"

