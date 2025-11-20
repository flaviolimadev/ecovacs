# 🔧 API URL Hardcoded (localhost) - CORRIGIDO

## ❌ Problema

O frontend estava usando `localhost:8000` hardcoded ao invés da variável de ambiente:

```javascript
// ❌ ANTES (ERRADO)
const API_URL = 'http://localhost:8000/api/v1';
```

**Resultado:**
```
POST http://localhost:8000/api/v1/auth/login net::ERR_CONNECTION_REFUSED
```

O frontend tentava conectar no localhost mesmo estando em produção!

---

## ✅ Solução Aplicada

### Arquivo: `resources/js/lib/api.ts`

**Antes:**
```javascript
// ❌ ERRADO - Hardcoded
const API_URL = 'http://localhost:8000/api/v1';
```

**Depois:**
```javascript
// ✅ CORRETO - Usa variável de ambiente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: `${API_URL}/v1`,
  // ...
});
```

**Agora:**
- ✅ Lê `VITE_API_URL` do `.env` (desenvolvimento) ou das variáveis do Easypanel (produção)
- ✅ Fallback para localhost se não configurado
- ✅ Funciona em qualquer ambiente

---

## ⚙️ Configuração no Easypanel

### 1. Acesse: **App Settings** → **Environment Variables**

### 2. Adicione/Verifique estas variáveis:

```bash
# Backend URL
APP_URL=https://ecovacs-app.kl5dxx.easypanel.host

# Frontend API URL (SEM /v1 no final!)
VITE_API_URL=https://ecovacs-app.kl5dxx.easypanel.host/api

# Sanctum domains
SANCTUM_STATEFUL_DOMAINS=ecovacs-app.kl5dxx.easypanel.host
```

### ⚠️ IMPORTANTE:

**VITE_API_URL NÃO deve ter `/v1` no final!**

```bash
# ✅ CORRETO
VITE_API_URL=https://ecovacs-app.kl5dxx.easypanel.host/api

# ❌ ERRADO
VITE_API_URL=https://ecovacs-app.kl5dxx.easypanel.host/api/v1
```

O código adiciona `/v1` automaticamente:
```javascript
baseURL: `${API_URL}/v1`
```

---

## 🔄 Como Funciona

### Desenvolvimento Local

**`.env` local:**
```bash
VITE_API_URL="http://localhost:8000/api"
```

**Axios usa:**
```
http://localhost:8000/api/v1
```

### Produção (Easypanel)

**Environment Variables no Easypanel:**
```bash
VITE_API_URL="https://ecovacs-app.kl5dxx.easypanel.host/api"
```

**Axios usa:**
```
https://ecovacs-app.kl5dxx.easypanel.host/api/v1
```

---

## 🧪 Como Testar

### 1. Verificar no Console do Navegador

Abra `F12` → Console → Digite:

```javascript
console.log(import.meta.env.VITE_API_URL);
```

**Deve retornar:**
- Localhost: `http://localhost:8000/api`
- Produção: `https://ecovacs-app.kl5dxx.easypanel.host/api`

### 2. Verificar Requisições

Abra `F12` → Network → Faça login

**Deve aparecer:**
```
POST https://ecovacs-app.kl5dxx.easypanel.host/api/v1/auth/login
Status: 200 OK
```

**NÃO deve aparecer:**
```
POST http://localhost:8000/api/v1/auth/login
Status: ERR_CONNECTION_REFUSED
```

---

## 📊 Variáveis de Ambiente Vite

### Como o Vite processa variáveis:

1. **Durante o build (`npm run build`):**
   - Vite lê todas as variáveis que começam com `VITE_`
   - Substitui `import.meta.env.VITE_*` pelos valores reais
   - Gera build com valores já substituídos

2. **No código compilado:**
   ```javascript
   // Código fonte
   const API_URL = import.meta.env.VITE_API_URL;
   
   // Após build (exemplo)
   const API_URL = "https://ecovacs-app.kl5dxx.easypanel.host/api";
   ```

### ⚠️ Importante:

**Variáveis VITE_ são incluídas no build!**
- Valores são substituídos em tempo de build
- São enviados para o navegador (público)
- **NÃO colocar segredos** em `VITE_*`!

---

## 🔐 Segurança

### ✅ Seguro colocar em VITE_:
- URLs públicas (API URL, CDN, etc.)
- IDs de serviços externos (Firebase, Analytics)
- Configurações de UI

### ❌ NUNCA colocar em VITE_:
- Senhas
- API Keys privadas
- Tokens secretos
- Credenciais de banco de dados

---

## 🚀 Deploy

Após fazer push, o Easypanel irá:

1. **Detectar commit** `959833b`
2. **Executar `npm run build`** (Vite lê `VITE_API_URL`)
3. **Gerar build** com URL correta substituída
4. **Servir arquivos** com configuração correta

**Tempo:** 2-5 minutos

---

## 🐛 Troubleshooting

### Frontend ainda usa localhost?

**Possíveis causas:**

1. **Build não foi feito após configurar variável:**
   - Solução: Fazer novo commit ou rebuild no Easypanel

2. **Variável não está no Easypanel:**
   - Verificar: App Settings → Environment Variables
   - Adicionar: `VITE_API_URL=https://...`

3. **Cache do navegador:**
   - Solução: `Ctrl+Shift+Delete` → Limpar cache
   - Ou: Modo anônimo `Ctrl+Shift+N`

4. **Variável com nome errado:**
   ```bash
   # ❌ ERRADO
   VUE_API_URL=...
   REACT_API_URL=...
   API_URL=...
   
   # ✅ CORRETO
   VITE_API_URL=...
   ```

### API retorna CORS error?

Verificar `SANCTUM_STATEFUL_DOMAINS`:

```bash
# Deve incluir o domínio da aplicação (SEM https://)
SANCTUM_STATEFUL_DOMAINS=ecovacs-app.kl5dxx.easypanel.host
```

---

## 📝 Checklist de Configuração

No Easypanel, verificar:

- [ ] `APP_ENV=production`
- [ ] `APP_URL=https://ecovacs-app.kl5dxx.easypanel.host`
- [ ] `VITE_API_URL=https://ecovacs-app.kl5dxx.easypanel.host/api` (sem /v1)
- [ ] `SANCTUM_STATEFUL_DOMAINS=ecovacs-app.kl5dxx.easypanel.host`
- [ ] Rebuild feito após configurar variáveis
- [ ] Cache do navegador limpo
- [ ] Console sem erros de conexão

---

## 📚 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `resources/js/lib/api.ts` | ✅ Usa `import.meta.env.VITE_API_URL` |
| `.env` | ✅ Comentário sobre configuração em produção |

---

## 🎯 Resultado Final

**Antes:**
```javascript
// Frontend sempre usava localhost
POST http://localhost:8000/api/v1/auth/login ❌
```

**Depois:**
```javascript
// Frontend usa URL configurada no Easypanel
POST https://ecovacs-app.kl5dxx.easypanel.host/api/v1/auth/login ✅
```

---

## 🔗 Links Úteis

- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Easypanel Environment Variables](https://easypanel.io/docs)

---

## ✅ Status: CORRIGIDO!

O frontend agora usa a URL configurada no Easypanel! 🎉

**Próximo passo:** Configurar `VITE_API_URL` no Easypanel e fazer rebuild.











