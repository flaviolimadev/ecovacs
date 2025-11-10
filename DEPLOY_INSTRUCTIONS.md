# 🚀 INSTRUÇÕES DE DEPLOY - INTEGRAÇÃO VIZZION

## ⚠️ IMPORTANTE: Execute estes comandos no servidor de produção

O erro 500 que você está recebendo é porque o código atualizado ainda não está em produção.

## 📋 Passos para Deploy:

### 1. Conectar no servidor (SSH)

```bash
ssh usuario@servidor
cd /caminho/do/projeto
```

### 2. Atualizar código do GitHub

```bash
git pull origin main
```

### 3. Rodar migrations (adicionar campos raw_response e error_message)

```bash
php artisan migrate --force
```

### 4. Limpar TODOS os caches do Laravel

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear
php artisan event:clear
```

### 5. Recarregar autoload do Composer

```bash
composer dump-autoload -o
```

### 6. Otimizar novamente

```bash
php artisan optimize
```

### 7. Reiniciar PHP-FPM (se necessário)

```bash
# Para Ubuntu/Debian com PHP 8.2
sudo systemctl restart php8.2-fpm

# OU para Docker/Easypanel
# Reinicie o container/serviço pelo painel
```

## ✅ Verificar se deu certo:

Execute este comando para verificar se o código está atualizado:

```bash
grep -n "89.116.74.42" app/Http/Controllers/API/V1/WithdrawController.php
```

Deve retornar:
```
335:            $ownerIp = '89.116.74.42';
```

## 🧪 Testar após deploy:

1. Acesse: `https://ecovacs-app.woty8c.easypanel.host`
2. Faça login
3. Tente fazer um saque de R$ 50,00
4. Deve funcionar sem erro 500

## 📊 Verificar logs em caso de erro:

```bash
tail -f storage/logs/laravel.log
```

## 🔍 Debug - Verificar estrutura da tabela:

```bash
php check_withdrawals_schema.php
```

Deve mostrar que os campos `raw_response` e `error_message` existem.

---

## 📝 Resumo das Mudanças:

1. ✅ IP fixo: `89.116.74.42`
2. ✅ Normalização de nome (remove acentos)
3. ✅ Campos `raw_response` e `error_message` na tabela `withdrawals`
4. ✅ Processamento automático para saques ≤ R$ 300
5. ✅ Botão "Pagar via Vizzion" no admin para saques > R$ 300

## 🆘 Se ainda der erro 500:

Execute o script de debug no servidor:

```bash
php test_withdrawal_debug.php
```

Isso vai mostrar exatamente onde está o erro.

