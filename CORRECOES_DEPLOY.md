# 🔧 Correções de Deploy - Saque e Depósito

## ✅ Problemas Identificados e Corrigidos

### 1. **Namespace Incorreto nos Controllers**
   - **Problema**: Os controllers usavam `namespace App\Http\Controllers\Api\V1;` (com `Api` minúsculo)
   - **Solução**: Corrigido para `namespace App\Http\Controllers\API\V1;` (com `API` maiúsculo)
   - **Arquivos corrigidos**:
     - ✅ `app/Http/Controllers/API/V1/WithdrawController.php`
     - ✅ `app/Http/Controllers/API/V1/DepositController.php`
     - ✅ `app/Http/Controllers/API/V1/WebhookController.php`

### 2. **Bloco do Ledger no WithdrawController**
   - **Status**: ✅ **JÁ ESTAVA CORRETO**
   - O bloco do Ledger (linhas 190-204) já estava com todos os campos necessários:
     - `type` => 'WITHDRAWAL'
     - `reference_type` => Withdrawal::class
     - `reference_id` => $withdrawal->id
     - `operation` => 'DEBIT'
     - `balance_type` => 'balance_withdrawn'

### 3. **DueDate no DepositController**
   - **Status**: ✅ **JÁ ESTAVA CORRETO**
   - O `dueDate` (linha 103) já estava usando `now()->addDays(2)->toDateString()`

## 📋 O Que Fazer no Próximo Deploy

### 1. **Fazer Commit e Push das Correções**
```bash
cd app
git add app/Http/Controllers/API/V1/WithdrawController.php
git add app/Http/Controllers/API/V1/DepositController.php
git add app/Http/Controllers/API/V1/WebhookController.php
git commit -m "fix: corrigir namespaces dos controllers (Api -> API)"
git push
```

### 2. **No Servidor, Após o Deploy**
```bash
cd /app

# Limpar caches
php artisan optimize:clear
composer dump-autoload -o
php artisan config:cache
php artisan route:cache
```

### 3. **Verificar se Está Funcionando**
```bash
# Testar saque
php test_withdrawal_quick.php

# Verificar logs
tail -f storage/logs/laravel.log
```

## 🎯 Por Que Isso Resolve o Problema?

O problema ocorria porque:
1. **PSR-4 Autoloading**: O Laravel usa PSR-4 para carregar classes. Se o namespace não corresponder exatamente à estrutura de pastas, o autoloader não encontra a classe.
2. **Estrutura de Pastas**: Os arquivos estão em `app/Http/Controllers/API/V1/` (com `API` maiúsculo)
3. **Namespace Antigo**: Os arquivos usavam `namespace App\Http\Controllers\Api\V1;` (com `Api` minúsculo)
4. **Resultado**: O Laravel não conseguia carregar os controllers corretamente, causando erros de "null value in column 'type'"

## ✅ Verificação Final

Após o deploy, verifique:
- ✅ Não há mais erros de "null value in column 'type'"
- ✅ Saques funcionam corretamente
- ✅ Depósitos funcionam corretamente
- ✅ Não há mais avisos de PSR-4 no `composer dump-autoload`

## 📝 Nota Importante

**NÃO É MAIS NECESSÁRIO** executar os comandos manuais no servidor após cada deploy. As correções foram aplicadas diretamente no código fonte e serão aplicadas automaticamente no próximo deploy.

