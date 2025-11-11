#!/bin/bash

echo "=========================================="
echo "  SCRIPT DE CORREÇÃO DE SAQUES"
echo "=========================================="
echo ""

cd /app

echo "1️⃣  Fazendo backup do arquivo atual..."
cp app/Http/Controllers/API/V1/WithdrawController.php app/Http/Controllers/API/V1/WithdrawController.php.BACKUP_$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"
echo ""

echo "2️⃣  Baixando versão correta do GitHub..."
curl -s -o app/Http/Controllers/API/V1/WithdrawController.php \
  https://raw.githubusercontent.com/flaviolimadev/ecovacs/main/app/Http/Controllers/API/V1/WithdrawController.php

if [ $? -eq 0 ]; then
    echo "✅ Arquivo baixado com sucesso"
else
    echo "❌ Erro ao baixar arquivo"
    exit 1
fi
echo ""

echo "3️⃣  Verificando conteúdo..."
grep -c "balance_type" app/Http/Controllers/API/V1/WithdrawController.php
echo "✅ Verificação concluída"
echo ""

echo "4️⃣  Limpando todos os caches..."
php artisan optimize:clear
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
echo "✅ Caches limpos"
echo ""

echo "5️⃣  Recompilando autoload..."
composer dump-autoload -o
echo "✅ Autoload recompilado"
echo ""

echo "6️⃣  Recacheando configurações..."
php artisan config:cache
php artisan route:cache
echo "✅ Configurações cacheadas"
echo ""

echo "=========================================="
echo "  ✅ CORREÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "📝 Para testar:"
echo "   php /app/test_withdrawal.php"
echo ""

