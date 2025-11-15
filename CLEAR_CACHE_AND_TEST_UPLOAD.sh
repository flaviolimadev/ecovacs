#!/bin/bash

# Script para limpar cache e testar upload
cd /app

echo "=== Limpando cache do Laravel ==="
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

echo ""
echo "=== Recriando cache de rotas ==="
php artisan route:cache

echo ""
echo "=== Verificando rotas de upload ==="
php artisan route:list | grep upload

echo ""
echo "✅ Cache limpo! Tente fazer upload novamente."

