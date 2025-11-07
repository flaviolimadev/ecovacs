#!/bin/bash

echo "🚀 Iniciando aplicação Laravel..."

# Esperar o banco de dados estar pronto
echo "⏳ Aguardando banco de dados..."
sleep 5

# Rodar migrations
echo "📦 Executando migrations..."
php artisan migrate --force

# Criar storage link se não existir
echo "🔗 Criando link de storage..."
php artisan storage:link || true

# Criar usuário admin se não existir
echo "👤 Criando usuário admin..."
php artisan db:seed --class=AdminUserSeeder --force || true

# Criar planos se não existirem
echo "📋 Criando planos..."
php artisan db:seed --class=PlansSeeder --force || true

# Limpar caches
echo "🧹 Limpando caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Recriar caches otimizados
echo "⚡ Otimizando caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Iniciar servidor
echo "✅ Iniciando servidor na porta ${PORT:-8000}..."
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}

