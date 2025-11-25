#!/bin/bash

echo "=========================================="
echo "  🔄 ATUALIZANDO BANCO DE DADOS"
echo "=========================================="
echo ""

cd /app

# Atualizar configurações usando PHP Artisan
php artisan tinker --execute="
use Illuminate\Support\Facades\DB;

// 1. Atualizar valor mínimo de saque
DB::table('settings')
    ->where('key', 'withdraw.min')
    ->update(['value' => '30']);
echo '✅ Valor mínimo de saque atualizado: R\$ 30\n';

// 2. Atualizar taxa de saque
DB::table('settings')
    ->where('key', 'withdraw.fee')
    ->update(['value' => '0.12']);
echo '✅ Taxa de saque atualizada: 12%\n';

// 3. Atualizar janela de horário
DB::table('settings')
    ->where('key', 'withdraw.window')
    ->update(['value' => json_encode([
        'days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        'start' => '10:00',
        'end' => '17:00'
    ])]);
echo '✅ Horário de saque atualizado: Segunda a Domingo, 10h-17h\n';

echo '\n📊 VERIFICANDO ATUALIZAÇÕES:\n\n';

// Verificar atualizações
\$settings = DB::table('settings')
    ->whereIn('key', ['withdraw.min', 'withdraw.fee', 'withdraw.window'])
    ->get();

foreach (\$settings as \$setting) {
    echo \"  • {\$setting->key}: {\$setting->value}\n\";
}
"

echo ""
echo "=========================================="
echo "  ✅ BANCO DE DADOS ATUALIZADO!"
echo "=========================================="
echo ""
echo "🎯 Próximos passos:"
echo "   1. Limpar cache: php artisan optimize:clear"
echo "   2. Testar no site: https://ownerb3.pro"
echo ""

