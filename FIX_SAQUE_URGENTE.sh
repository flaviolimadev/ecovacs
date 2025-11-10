#!/bin/bash

echo "🚨 FIX URGENTE: Corrigindo erro 500 no saque"
echo "=============================================="
echo ""

echo "1️⃣ Limpando cache do Laravel..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear

echo ""
echo "2️⃣ Limpando OPcache..."
if [ -f public/clear-opcache.php ]; then
    rm public/clear-opcache.php
fi

cat > public/clear-opcache.php << 'EOF'
<?php
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "✅ OPcache limpo!\n";
} else {
    echo "⚠️ OPcache não está ativo\n";
}
echo "PHP Version: " . phpversion() . "\n";
echo "Loaded extensions: " . implode(', ', get_loaded_extensions()) . "\n";
?>
EOF

curl http://localhost/clear-opcache.php
rm public/clear-opcache.php

echo ""
echo "3️⃣ Verificando versão do código..."
echo "Verificando WithdrawController..."
grep -n "reference_type\|ref_type" app/Http/Controllers/API/V1/WithdrawController.php | head -5

echo ""
echo "4️⃣ Rodando composer dump-autoload..."
composer dump-autoload

echo ""
echo "5️⃣ Otimizando aplicação..."
php artisan optimize

echo ""
echo "✅ PRONTO! Teste novamente:"
echo "   https://ecovacs-app.woty8c.easypanel.host/withdraw"
echo ""

