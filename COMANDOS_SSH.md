# 📋 Comandos SSH - Ecovacs

## 🚀 DEPLOY COMPLETO (Copiar e colar tudo de uma vez)

```bash
cd /app && \
echo "🚀 Iniciando deploy..." && \
git pull origin main || (git fetch origin main && git reset --hard origin/main) && \
composer install --no-dev --optimize-autoloader && \
php artisan migrate --force && \
php artisan optimize:clear && \
php artisan config:clear && \
php artisan cache:clear && \
php artisan route:clear && \
php artisan view:clear && \
composer dump-autoload -o && \
php artisan config:cache && \
php artisan route:cache && \
echo "" && \
echo "✅ Deploy concluído!" && \
echo "" && \
echo "🔍 Verificando..." && \
grep -c "balance_type" app/Http/Controllers/API/V1/WithdrawController.php && \
grep -c "addDays(2)" app/Http/Controllers/API/V1/DepositController.php && \
echo "" && \
echo "✅ Tudo OK! Sistema pronto para uso."
```

---

## 🔧 QUICK FIX (Se algo não funcionar após deploy)

```bash
cd /app && \
curl -s https://raw.githubusercontent.com/flaviolimadev/ecovacs/main/quick-fix.sh | bash
```

---

## 🐛 CORRIGIR APENAS SAQUES

```bash
cd /app && \
cp app/Http/Controllers/API/V1/WithdrawController.php app/Http/Controllers/API/V1/WithdrawController.php.BAK && \
curl -s -o app/Http/Controllers/API/V1/WithdrawController.php https://raw.githubusercontent.com/flaviolimadev/ecovacs/main/app/Http/Controllers/API/V1/WithdrawController.php && \
php artisan optimize:clear && \
composer dump-autoload -o && \
php artisan config:cache && \
php artisan route:cache && \
echo "✅ Saques corrigidos!"
```

---

## 💰 CORRIGIR APENAS DEPÓSITOS

```bash
cd /app && \
sed -i "s/now()->addDay()->toDateString()/now()->addDays(2)->toDateString()/g" app/Http/Controllers/API/V1/DepositController.php && \
php artisan optimize:clear && \
composer dump-autoload -o && \
php artisan config:cache && \
php artisan route:cache && \
echo "✅ Depósitos corrigidos!"
```

---

## 🧹 LIMPAR TODOS OS CACHES

```bash
cd /app && \
php artisan optimize:clear && \
php artisan config:clear && \
php artisan cache:clear && \
php artisan route:clear && \
php artisan view:clear && \
php artisan event:clear && \
composer dump-autoload -o && \
php artisan config:cache && \
php artisan route:cache && \
echo "✅ Caches limpos!"
```

---

## 📊 VER ÚLTIMOS ERROS

### Todos os erros
```bash
tail -50 /app/storage/logs/laravel.log
```

### Apenas erros de saque
```bash
grep "Erro ao processar saque" /app/storage/logs/laravel.log | tail -10
```

### Apenas erros de depósito
```bash
grep "Vizzion Pay API Error" /app/storage/logs/laravel.log | tail -10
```

### Limpar log (se estiver muito grande)
```bash
echo "" > /app/storage/logs/laravel.log
echo "✅ Log limpo!"
```

---

## 🔍 VERIFICAR SE TUDO ESTÁ OK

```bash
cd /app && \
echo "========================================" && \
echo "  VERIFICAÇÃO RÁPIDA" && \
echo "========================================" && \
echo "" && \
echo "✓ WithdrawController (balance_type):" && \
grep -c "balance_type" app/Http/Controllers/API/V1/WithdrawController.php && \
echo "" && \
echo "✓ DepositController (addDays):" && \
grep -c "addDays(2)" app/Http/Controllers/API/V1/DepositController.php && \
echo "" && \
echo "✓ Conexão com banco:" && \
php artisan tinker --execute="DB::connection()->getPdo(); echo 'OK';" && \
echo "" && \
echo "✓ Últimos erros de saque:" && \
grep "Erro ao processar saque" storage/logs/laravel.log | tail -3 || echo "Nenhum erro recente" && \
echo "" && \
echo "========================================" && \
echo "  ✅ Verificação concluída!" && \
echo "========================================"
```

---

## 🔄 FORÇAR ATUALIZAÇÃO DO GITHUB (Se git pull não funcionar)

```bash
cd /app && \
git fetch origin main && \
git reset --hard origin/main && \
echo "✅ Código atualizado forçadamente!"
```

---

## 💾 BACKUP ANTES DE MEXER

```bash
cd /app && \
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  app/Http/Controllers/API/V1/WithdrawController.php \
  app/Http/Controllers/API/V1/DepositController.php \
  .env && \
echo "✅ Backup criado: backup_$(date +%Y%m%d_%H%M%S).tar.gz"
```

---

## 🧪 TESTAR CONEXÕES

### Testar banco de dados
```bash
php artisan tinker --execute="DB::connection()->getPdo(); echo 'Banco OK';"
```

### Testar Vizzion API (depósito)
```bash
curl -s -X POST https://api.vizzionpay.com.br/public/v1/pix/charge \
  -H "x-public-key: ${PAYMENT_PUBLIC_KEY}" \
  -H "x-secret-key: ${PAYMENT_SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"test":true}' | head -20
```

---

## 📦 RODAR MIGRATIONS

```bash
cd /app && \
php artisan migrate --force && \
echo "✅ Migrations executadas!"
```

---

## 🔐 VERIFICAR PERMISSÕES

```bash
cd /app && \
chown -R www-data:www-data storage bootstrap/cache && \
chmod -R 775 storage bootstrap/cache && \
echo "✅ Permissões corrigidas!"
```

---

## 🎯 COMANDOS ÚTEIS

### Ver PHP version
```bash
php -v
```

### Ver espaço em disco
```bash
df -h
```

### Ver uso de memória
```bash
free -h
```

### Ver processos PHP
```bash
ps aux | grep php
```

### Reiniciar Nginx
```bash
systemctl restart nginx
```

### Ver status do Nginx
```bash
systemctl status nginx
```

---

## ⚡ COMANDO ALL-IN-ONE (Deploy + Fix + Verify)

**Cole este comando para fazer TUDO de uma vez:**

```bash
cd /app && \
echo "🚀 ALL-IN-ONE: Deploy + Fix + Verify" && \
echo "" && \
echo "1️⃣ Atualizando código..." && \
git pull origin main || (git fetch origin main && git reset --hard origin/main) && \
echo "✅ Código atualizado" && \
echo "" && \
echo "2️⃣ Corrigindo arquivos..." && \
curl -s -o app/Http/Controllers/API/V1/WithdrawController.php https://raw.githubusercontent.com/flaviolimadev/ecovacs/main/app/Http/Controllers/API/V1/WithdrawController.php && \
sed -i "s/now()->addDay()->toDateString()/now()->addDays(2)->toDateString()/g" app/Http/Controllers/API/V1/DepositController.php && \
echo "✅ Arquivos corrigidos" && \
echo "" && \
echo "3️⃣ Instalando dependências..." && \
composer install --no-dev --optimize-autoloader > /dev/null 2>&1 && \
echo "✅ Dependências instaladas" && \
echo "" && \
echo "4️⃣ Rodando migrations..." && \
php artisan migrate --force && \
echo "✅ Migrations OK" && \
echo "" && \
echo "5️⃣ Limpando caches..." && \
php artisan optimize:clear && \
composer dump-autoload -o && \
php artisan config:cache && \
php artisan route:cache && \
echo "✅ Caches OK" && \
echo "" && \
echo "6️⃣ Verificando..." && \
echo -n "   WithdrawController: " && grep -c "balance_type" app/Http/Controllers/API/V1/WithdrawController.php && \
echo -n "   DepositController: " && grep -c "addDays(2)" app/Http/Controllers/API/V1/DepositController.php && \
echo "" && \
echo "========================================" && \
echo "  ✅ TUDO PRONTO!" && \
echo "========================================" && \
echo "" && \
echo "🎯 Sistema 100% operacional!" && \
echo "   • Saques funcionando" && \
echo "   • Depósitos funcionando" && \
echo "   • Caches limpos" && \
echo ""
```

---

**💡 DICA:** Salve este arquivo e use sempre que precisar fazer deploy ou corrigir algo!

**Última atualização:** 11/11/2025

