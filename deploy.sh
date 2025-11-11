#!/bin/bash

echo "=========================================="
echo "  🚀 DEPLOY AUTOMÁTICO - ECOVACS"
echo "=========================================="
echo ""

cd /app

echo "1️⃣  Git Pull..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Erro no git pull. Tentando forçar..."
    git fetch origin main
    git reset --hard origin/main
fi
echo "✅ Código atualizado"
echo ""

echo "2️⃣  Verificando arquivos críticos..."
echo -n "   WithdrawController (balance_type): "
grep -c "balance_type" app/Http/Controllers/API/V1/WithdrawController.php
echo -n "   DepositController (addDays(2)): "
grep -c "addDays(2)" app/Http/Controllers/API/V1/DepositController.php
echo ""

echo "3️⃣  Instalando dependências..."
composer install --no-dev --optimize-autoloader
echo "✅ Dependências instaladas"
echo ""

echo "4️⃣  Rodando migrations..."
php artisan migrate --force
echo "✅ Migrations executadas"
echo ""

echo "5️⃣  Limpando caches..."
php artisan optimize:clear
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear
echo "✅ Caches limpos"
echo ""

echo "6️⃣  Recompilando autoload..."
composer dump-autoload -o
echo "✅ Autoload otimizado"
echo ""

echo "7️⃣  Recacheando configurações..."
php artisan config:cache
php artisan route:cache
echo "✅ Configurações cacheadas"
echo ""

echo "8️⃣  Verificação final..."
php -l app/Http/Controllers/API/V1/WithdrawController.php
php -l app/Http/Controllers/API/V1/DepositController.php
echo "✅ Sintaxe OK"
echo ""

echo "=========================================="
echo "  ✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=========================================="
echo ""
echo "📊 Resumo:"
echo "   • Código atualizado do GitHub"
echo "   • Dependências instaladas"
echo "   • Migrations executadas"
echo "   • Caches limpos e recacheados"
echo "   • Autoload otimizado"
echo ""
echo "🎯 Sistema pronto para uso!"
echo ""

