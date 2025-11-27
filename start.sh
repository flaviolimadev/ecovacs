#!/bin/bash
set -e

echo "🚀 Iniciando aplicação Laravel..."

# Criar diretórios necessários
mkdir -p storage/framework/{sessions,views,cache}
mkdir -p storage/logs
mkdir -p bootstrap/cache

# Configurar permissões
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# Esperar banco de dados
echo "⏳ Aguardando banco de dados..."
for i in {1..30}; do
    if php artisan db:show &>/dev/null; then
        echo "✅ Banco de dados conectado!"
        break
    fi
    echo "Tentativa $i/30..."
    sleep 2
done

# Rodar migrations
echo "📦 Executando migrations..."
php artisan migrate --force || echo "⚠️ Migrations falharam (pode ser normal se já existirem)"

# Storage link
echo "🔗 Criando storage link..."
php artisan storage:link || true

# Seeders (apenas se tabelas estiverem vazias)
echo "👤 Verificando seeders..."
php artisan db:seed --class=AdminUserSeeder --force || true
# php artisan db:seed --class=PlansSeeder --force || true  # ❌ DESABILITADO - Não modificar planos

# Otimizar para produção
echo "⚡ Otimizando aplicação..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Iniciar servidor
PORT=${PORT:-8000}
echo "✅ Servidor iniciando na porta $PORT..."
php artisan serve --host=0.0.0.0 --port=$PORT

