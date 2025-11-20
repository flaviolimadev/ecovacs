# Dockerfile para Laravel + React SPA
FROM php:8.2-fpm-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    postgresql-dev \
    nodejs \
    npm \
    bash

# Instalar extensões PHP
RUN docker-php-ext-install pdo pdo_pgsql pgsql zip gd

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar arquivos do projeto
COPY . .

# Instalar dependências PHP
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Instalar dependências Node.js e fazer build do frontend
RUN npm ci && npm run build

# Otimizar Laravel
RUN php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

# Configurar permissões
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Stage final
FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    postgresql-dev \
    nginx \
    supervisor

RUN docker-php-ext-install pdo pdo_pgsql pgsql

WORKDIR /var/www/html

COPY --from=base /var/www/html /var/www/html
COPY --from=base /usr/local/etc/php /usr/local/etc/php

# Copiar configurações do Nginx
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf

# Copiar configuração do Supervisor
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expor porta
EXPOSE 80

# Comando de inicialização
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]











