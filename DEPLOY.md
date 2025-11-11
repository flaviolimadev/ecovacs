# 🚀 Guia de Deploy - Ecovacs

## 📋 Checklist Pré-Deploy

- [ ] Código commitado no GitHub (branch `main`)
- [ ] Testes locais passando
- [ ] Migrations criadas (se necessário)
- [ ] `.env` configurado no servidor

---

## 🔧 Deploy Automático (RECOMENDADO)

### Método 1: Script Completo (Copiar e Colar no SSH)

```bash
cd /app && \
curl -s https://raw.githubusercontent.com/flaviolimadev/ecovacs/main/deploy.sh | bash && \
bash post-deploy-check.sh
```

---

### Método 2: Passo a Passo

#### 1. Conectar no servidor SSH

```bash
ssh root@SEU_SERVIDOR
```

#### 2. Baixar scripts de deploy

```bash
cd /app
curl -s -O https://raw.githubusercontent.com/flaviolimadev/ecovacs/main/deploy.sh
curl -s -O https://raw.githubusercontent.com/flaviolimadev/ecovacs/main/post-deploy-check.sh
chmod +x deploy.sh post-deploy-check.sh
```

#### 3. Executar deploy

```bash
bash deploy.sh
```

#### 4. Verificar se tudo está OK

```bash
bash post-deploy-check.sh
```

---

## 🔥 Deploy Manual (Se o Automático Falhar)

```bash
cd /app

# 1. Atualizar código
git pull origin main

# 2. Instalar dependências
composer install --no-dev --optimize-autoloader

# 3. Rodar migrations
php artisan migrate --force

# 4. Limpar caches
php artisan optimize:clear
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# 5. Recompilar
composer dump-autoload -o

# 6. Recachear
php artisan config:cache
php artisan route:cache

# 7. Verificar
bash post-deploy-check.sh
```

---

## 🐛 Troubleshooting

### ❌ Erro: "Erro ao processar saque"

```bash
cd /app
curl -s -o app/Http/Controllers/API/V1/WithdrawController.php \
  https://raw.githubusercontent.com/flaviolimadev/ecovacs/main/app/Http/Controllers/API/V1/WithdrawController.php
php artisan optimize:clear
composer dump-autoload -o
```

### ❌ Erro: "Invalid dueDate" (Vizzion API)

```bash
cd /app
sed -i "s/now()->addDay()->toDateString()/now()->addDays(2)->toDateString()/g" \
  app/Http/Controllers/API/V1/DepositController.php
php artisan optimize:clear
```

### ❌ Erro: "Git pull failed"

```bash
cd /app
git fetch origin main
git reset --hard origin/main
```

### ❌ Cache não limpa

```bash
cd /app
php artisan optimize:clear
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear
composer dump-autoload -o
php artisan config:cache
php artisan route:cache
```

---

## 📊 Verificar Logs Após Deploy

### Ver últimos erros

```bash
tail -50 /app/storage/logs/laravel.log
```

### Ver erros de saque

```bash
grep "Erro ao processar saque" /app/storage/logs/laravel.log | tail -10
```

### Ver erros de depósito

```bash
grep "Vizzion Pay API Error" /app/storage/logs/laravel.log | tail -10
```

---

## 🎯 Comandos Úteis

### Testar conexão com banco

```bash
php artisan tinker --execute="DB::connection()->getPdo(); echo 'OK';"
```

### Ver versão do PHP

```bash
php -v
```

### Ver espaço em disco

```bash
df -h
```

### Ver status do servidor web

```bash
systemctl status nginx  # ou apache2
```

---

## 🔄 Deploy Automático com GitHub Actions (Futuro)

Criar arquivo `.github/workflows/deploy.yml` para deploy automático a cada push na branch `main`.

---

## 📞 Suporte

Em caso de problemas persistentes:
1. Verificar logs: `tail -50 storage/logs/laravel.log`
2. Executar `post-deploy-check.sh`
3. Verificar `.env` no servidor
4. Entrar em contato com suporte técnico

---

**Última atualização:** 11/11/2025

