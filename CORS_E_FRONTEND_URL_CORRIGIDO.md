# ✅ CORS e FRONTEND_URL Configurado

## 🎯 Problema Resolvido

**Erro CORS:** `Access-Control-Allow-Origin header is not present`

**Causa:** O Laravel não estava permitindo requisições do domínio customizado `clickads.pro`.

## 🔧 Mudanças Implementadas

### 1. **Config CORS Dinâmico** (`config/cors.php`)

```php
'allowed_origins' => array_filter([
    env('APP_URL'),
    env('FRONTEND_URL', env('APP_URL')),
    'http://localhost:5173',
    'http://localhost:8000',
    // ... outros localhost
]),
```

Agora o CORS lê as variáveis `APP_URL` e `FRONTEND_URL` do `.env`!

### 2. **Frontend URL Config** (`config/app.php`)

```php
'frontend_url' => env('FRONTEND_URL', env('APP_URL', 'http://localhost')),
```

Nova configuração para separar o domínio do frontend do backend.

### 3. **Links de Indicação Dinâmicos** (`NetworkController.php`)

**Antes:**
```php
'referral_link' => url("/register?ref={$user->referral_code}"),
```

**Depois:**
```php
'referral_link' => config('app.frontend_url') . "/register?ref={$user->referral_code}",
```

Agora os links de indicação usam o domínio configurado em `FRONTEND_URL`!

### 4. **Logs de Debug** (`InvestmentController.php`)

Adicionados logs para debugar o problema da página `/earnings`:

```php
Log::info('Buscando investimentos', [
    'user_id' => $user->id,
    'status_filter' => $status,
]);

Log::info('Investimentos encontrados', [
    'user_id' => $user->id,
    'total' => $cycles->count(),
    'cycles_ids' => $cycles->pluck('id')->toArray(),
]);
```

## 📋 Configuração no Easypanel

### Variáveis de Ambiente

Adicione no painel do Easypanel (seção **Environment Variables**):

```bash
# Ambiente
APP_ENV=production
APP_DEBUG=false

# URLs
APP_URL=https://ecovacs-app.kl5dxx.easypanel.host
FRONTEND_URL=https://clickads.pro

# API para o frontend
VITE_API_URL=https://ecovacs-app.kl5dxx.easypanel.host/api

# Sanctum
SANCTUM_STATEFUL_DOMAINS=clickads.pro

# Banco de Dados
DB_CONNECTION=pgsql
DB_HOST=ecovacs_bancodados
DB_PORT=5432
DB_DATABASE=ecovacs
DB_USERNAME=postgres
DB_PASSWORD=98d5a8481623318d0f4a
DB_SSLMODE=disable
```

### ⚠️ Atenção

- **`APP_URL`** = Onde a API Laravel está rodando (Easypanel)
- **`FRONTEND_URL`** = Onde o frontend React está sendo servido (domínio customizado)
- **`VITE_API_URL`** = URL da API que o frontend vai chamar
- **`SANCTUM_STATEFUL_DOMAINS`** = **SEM** `https://`, apenas o domínio: `clickads.pro`

## 🚀 Após Deploy

Execute no terminal do Easypanel:

```bash
# Limpar caches
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Recriar caches (produção)
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Verificar configuração
php artisan config:show app.frontend_url
php artisan config:show cors.allowed_origins
```

## 🧪 Testar CORS

Abra o DevTools do navegador (F12) → **Console** e execute:

```javascript
fetch('https://ecovacs-app.kl5dxx.easypanel.host/api/v1/plans', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('✅ CORS OK:', data))
.catch(err => console.error('❌ CORS Error:', err));
```

Se retornar os planos, o CORS está funcionando! ✅

## 🔗 Links de Indicação

Agora os links em:
- `/profile` (seção de indicação)
- `/members` (botão "Compartilhar Link")
- API `/api/v1/network/stats`
- API `/api/v1/network/referral-link`

Vão usar o domínio configurado em `FRONTEND_URL`:

```
https://clickads.pro/register?ref=ADMIN001
```

## 📁 Arquivos Modificados

1. ✅ `config/cors.php` - CORS dinâmico
2. ✅ `config/app.php` - Nova config `frontend_url`
3. ✅ `app/Http/Controllers/API/V1/NetworkController.php` - Links dinâmicos
4. ✅ `app/Http/Controllers/API/V1/InvestmentController.php` - Logs de debug
5. ✅ `.env.example` - Documentação atualizada
6. ✅ `DEBUG_EARNINGS_PAGE.md` - Guia de debug criado

## 🐛 Debug /earnings

Criei um guia completo: **`DEBUG_EARNINGS_PAGE.md`**

Siga os passos para descobrir por que os planos não aparecem na página `/earnings`.

## ✨ Resumo

- ✅ CORS agora permite `clickads.pro`
- ✅ Links de indicação usam domínio customizado
- ✅ Logs adicionados para debug
- ✅ Configuração centralizada no `.env`
- ✅ Fácil de alterar domínio sem tocar no código

## 🆘 Se ainda der erro

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Reinicie o container** no Easypanel
3. **Verifique as variáveis de ambiente** no painel
4. **Veja os logs:** `tail -f storage/logs/laravel.log`
5. **Teste a API direto:** `curl https://ecovacs-app.kl5dxx.easypanel.host/api/v1/plans`

---

**Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Commit:** `7c61e70`

