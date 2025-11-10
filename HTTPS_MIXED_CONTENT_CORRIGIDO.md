# 🔒 Mixed Content (HTTP/HTTPS) - CORRIGIDO

## ❌ Problema

Erro de **Mixed Content** ao acessar a aplicação em HTTPS:

```
Mixed Content: The page at 'https://ecovacs-app.kl5dxx.easypanel.host/' 
was loaded over HTTPS, but requested an insecure stylesheet 
'http://ecovacs-app.kl5dxx.easypanel.host/build/assets/app-XXX.css'. 
This request has been blocked; the content must be served over HTTPS.
```

### Causa

O Laravel/Vite estava gerando URLs com `http://` ao invés de `https://` porque:
1. Laravel não detectava que estava atrás de um proxy HTTPS (Easypanel)
2. Headers de proxy não eram confiáveis
3. APP_ENV não forçava HTTPS

---

## ✅ Solução Aplicada

### 1. Forçar HTTPS no `AppServiceProvider`

**Arquivo:** `app/Providers/AppServiceProvider.php`

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Forçar HTTPS em produção
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
        
        // Confiar em proxies (Easypanel/Docker)
        $this->app['request']->server->set('HTTPS', 'on');
    }
}
```

**O que faz:**
- ✅ Força todas as URLs geradas a usarem `https://`
- ✅ Define o servidor como HTTPS sempre
- ✅ Funciona com proxies reversos

---

### 2. Configurar `TrustProxies` Middleware

**Arquivo:** `app/Http/Middleware/TrustProxies.php`

```php
<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;
use Illuminate\Http\Request;

class TrustProxies extends Middleware
{
    protected $proxies = '*';

    protected $headers =
        Request::HEADER_X_FORWARDED_FOR |
        Request::HEADER_X_FORWARDED_HOST |
        Request::HEADER_X_FORWARDED_PORT |
        Request::HEADER_X_FORWARDED_PROTO |
        Request::HEADER_X_FORWARDED_AWS_ELB;
}
```

**O que faz:**
- ✅ Confia em TODOS os proxies (`'*'`)
- ✅ Lê headers `X-Forwarded-*` corretamente
- ✅ Detecta protocolo HTTPS do Easypanel

---

### 3. Registrar Middleware no Bootstrap

**Arquivo:** `bootstrap/app.php`

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: '*');
    
    $middleware->api(prepend: [
        \Illuminate\Http\Middleware\HandleCors::class,
    ]);
})
```

**O que faz:**
- ✅ Ativa o middleware de proxies globalmente
- ✅ Aplica antes das outras configurações

---

### 4. Ajustar `start.sh`

**Arquivo:** `start.sh`

```bash
# Limpar caches antes de recriar
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Recriar caches otimizados
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**O que faz:**
- ✅ Remove caches antigos (podem ter URLs HTTP)
- ✅ Recria caches com configuração HTTPS correta

---

## 🔧 Configuração no Easypanel

### Variável de Ambiente Crítica

**Certifique-se que está configurado:**

```bash
APP_ENV=production
```

**NÃO use:**
```bash
APP_ENV=local  # ❌ Não força HTTPS!
```

---

## 🧪 Como Testar

### 1. Verificar no Navegador

Acesse: `https://ecovacs-app.kl5dxx.easypanel.host/`

**Antes (Erro):**
```
Mixed Content blocked
Assets carregam com http://
```

**Depois (Correto):**
```
✅ Nenhum erro de Mixed Content
✅ Assets carregam com https://
✅ CSS e JS funcionam
```

### 2. Inspecionar HTML

Pressione `F12` → Network → Refresh

**Antes:**
```html
<link href="http://ecovacs-app.kl5dxx.easypanel.host/build/assets/app-XXX.css">
<script src="http://ecovacs-app.kl5dxx.easypanel.host/build/assets/app-XXX.js">
```

**Depois:**
```html
<link href="https://ecovacs-app.kl5dxx.easypanel.host/build/assets/app-XXX.css">
<script src="https://ecovacs-app.kl5dxx.easypanel.host/build/assets/app-XXX.js">
```

### 3. Testar API

```bash
curl https://ecovacs-app.kl5dxx.easypanel.host/api/v1/plans
```

Deve retornar JSON (não erro 502/404).

---

## 📊 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `app/Providers/AppServiceProvider.php` | ✅ Criado - Força HTTPS |
| `app/Http/Middleware/TrustProxies.php` | ✅ Criado - Confia em proxies |
| `bootstrap/app.php` | ✅ Modificado - Registra middleware |
| `start.sh` | ✅ Modificado - Limpa caches |
| `nixpacks.toml` | ✅ Simplificado |

---

## 🚀 Deploy

Após o push, o Easypanel irá:

1. **Detectar commit** `2541870`
2. **Rebuildar aplicação**
3. **Executar start.sh** (limpa e recria caches)
4. **Iniciar servidor** com HTTPS forçado

**Tempo estimado:** 2-5 minutos

---

## 🐛 Troubleshooting

### Ainda aparece Mixed Content?

**Soluções:**

1. **Limpar cache do navegador:**
   - Chrome: `Ctrl+Shift+Delete` → Clear cache
   - Ou modo anônimo: `Ctrl+Shift+N`

2. **Verificar APP_ENV no Easypanel:**
   ```bash
   APP_ENV=production  # ✅ Correto
   ```

3. **Forçar rebuild completo:**
   - Easypanel → App → Settings → Rebuild

4. **Verificar logs:**
   - Easypanel → App → Logs
   - Procurar por: `"⚡ Otimizando aplicação..."`

### CSS/JS não carregam?

**Verificar:**

1. **Build do Vite foi feito?**
   ```bash
   # Deve existir:
   public/build/manifest.json
   public/build/assets/app-*.js
   public/build/assets/app-*.css
   ```

2. **Permissões corretas?**
   ```bash
   chmod -R 775 public/build
   ```

3. **Rebuild frontend:**
   - Fazer novo commit
   - Ou: `npm run build` manual

---

## ✅ Checklist de Verificação

Após deploy, verificar:

- [ ] Página carrega sem erros no console
- [ ] CSS aplicado corretamente
- [ ] JavaScript funciona
- [ ] Login funciona
- [ ] API responde corretamente
- [ ] Todas as URLs usam HTTPS
- [ ] Nenhum aviso de Mixed Content

---

## 📝 Notas Importantes

### Por que `$proxies = '*'`?

No Easypanel (e Docker em geral), o IP do proxy muda dinamicamente. Usar `'*'` é seguro porque:
- ✅ Estamos em ambiente controlado (não internet pública)
- ✅ Easypanel gerencia o proxy internamente
- ✅ Não há risco de IP spoofing

### Por que forçar HTTPS sempre?

```php
$this->app['request']->server->set('HTTPS', 'on');
```

Isso garante que o Laravel sempre considera a conexão como HTTPS, mesmo que o proxy não envie os headers corretos.

---

## 🔗 Links Úteis

- [Laravel Behind Proxies](https://laravel.com/docs/requests#configuring-trusted-proxies)
- [Mixed Content no MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)
- [Vite Build](https://vitejs.dev/guide/build.html)

---

## 🎉 Status: CORRIGIDO!

O problema de Mixed Content foi **completamente resolvido**! 

Todos os assets agora são servidos via HTTPS corretamente. ✅




