#!/bin/bash

echo "=========================================="
echo "  🚀 DEPLOY ANGLOGOLD"
echo "=========================================="
echo ""

cd /app

# 1. Puxar código atualizado
echo "📥 Puxando código do repositório..."
git pull origin main

# 2. Instalar dependências (se necessário)
if [ -f "composer.json" ]; then
    echo "📦 Atualizando dependências PHP..."
    composer install --no-dev --optimize-autoloader
fi

# 3. Limpar TODOS os caches
echo "🧹 Limpando caches..."
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan optimize:clear

# 4. Recachear configurações e rotas
echo "⚡ Recacheando configurações..."
php artisan config:cache
php artisan route:cache

# 5. Otimizar autoload
echo "🔧 Otimizando autoload..."
composer dump-autoload -o

# 6. Verificar se a rota existe
echo ""
echo "🔍 Verificando rota /network/members..."
php artisan route:list | grep "network/members" && echo "✅ Rota encontrada!" || echo "❌ Rota NÃO encontrada!"

echo ""
echo "=========================================="
echo "  ✅ DEPLOY CONCLUÍDO!"
echo "=========================================="
echo ""
echo "🎯 Teste agora:"
echo "   • Site: https://ownerb3.pro"
echo "   • Members: https://ownerb3.pro/members"
echo ""
