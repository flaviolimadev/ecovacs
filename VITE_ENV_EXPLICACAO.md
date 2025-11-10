# 📌 Como Funcionam as Variáveis de Ambiente do Vite

## ✅ SIM, o Register usa o `.env`

A página de registro (e toda a aplicação React) usa a variável `VITE_API_URL` do `.env`:

```typescript
// resources/js/lib/api.ts (linha 4)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
```

**Fluxo:**
1. `Register.tsx` → usa `useAuth()`
2. `AuthContext.tsx` → usa `authAPI.register()`
3. `api.ts` → usa `VITE_API_URL` do `.env`

## ⚠️ IMPORTANTE: Diferença Desenvolvimento vs Produção

### 🏠 Desenvolvimento (Local)

Quando você roda `npm run dev`:
- ✅ Vite lê o `.env` **em tempo real**
- ✅ Se você mudar `VITE_API_URL` no `.env`, basta recarregar a página
- ✅ Funciona dinamicamente

```bash
# .env local
VITE_API_URL="http://localhost:8000/api"
```

### 🚀 Produção (Easypanel)

Quando você faz `npm run build`:
- ⚠️ Vite **compila** as variáveis no JavaScript
- ⚠️ Os valores ficam **"gravados"** nos arquivos `.js` gerados
- ⚠️ Mudar o `.env` **NÃO afeta** o código já compilado

**Exemplo:** Se você compilar com `VITE_API_URL="http://localhost:8000/api"` e depois mudar para `https://ecovacs-app.kl5dxx.easypanel.host/api`, **não vai funcionar** até você fazer rebuild!

## 🔧 Como Configurar Corretamente no Easypanel

### Opção 1: Variáveis de Ambiente do Painel (Recomendado)

No painel do Easypanel, configure as variáveis **ANTES** de fazer build:

```bash
# Backend (Laravel)
APP_URL=https://ecovacs-app.kl5dxx.easypanel.host
FRONTEND_URL=https://clickads.pro
SANCTUM_STATEFUL_DOMAINS=clickads.pro

# Frontend (Vite) - IMPORTANTE!
VITE_API_URL=https://ecovacs-app.kl5dxx.easypanel.host/api
```

Depois, o Nixpacks vai:
1. Ler essas variáveis
2. Fazer `npm run build` com os valores corretos
3. Gerar o JavaScript com a URL certa

### Opção 2: Arquivo `.env.production` (Alternativa)

Você pode criar um arquivo `.env.production` no projeto:

```bash
# .env.production
VITE_API_URL=https://ecovacs-app.kl5dxx.easypanel.host/api
VITE_APP_NAME=Ecovacs
```

O Vite vai usar automaticamente esse arquivo ao fazer `npm run build`.

## 🧪 Como Verificar se Está Funcionando

### 1. No Navegador (DevTools → Console)

```javascript
// Verificar a URL compilada
console.log('API URL:', import.meta.env.VITE_API_URL);

// Ou inspecionar o código compilado
// Procurar por "ecovacs-app.kl5dxx.easypanel.host" nos arquivos .js
```

### 2. Inspecionar Requisições (DevTools → Network)

Quando você fizer login/registro, veja para onde a requisição vai:
- ✅ Certo: `https://ecovacs-app.kl5dxx.easypanel.host/api/v1/auth/register`
- ❌ Errado: `http://localhost:8000/api/v1/auth/register`

### 3. Ver o Build Gerado

```bash
# Procurar a URL nos arquivos compilados
grep -r "localhost:8000" public/build/assets/

# Se encontrar, significa que compilou com URL errada!
```

## 🔄 Quando Fazer Rebuild

Você PRECISA fazer rebuild quando mudar:
- ✅ `VITE_API_URL`
- ✅ `VITE_APP_NAME`
- ✅ Qualquer `VITE_*` no `.env`

Você **NÃO** precisa rebuild para:
- ❌ `APP_URL` (backend)
- ❌ `DB_*` (banco)
- ❌ `SANCTUM_*` (backend)

## 📋 Checklist de Deploy

Antes de fazer deploy:

- [ ] Configurar `VITE_API_URL` no painel do Easypanel
- [ ] Verificar que aponta para o backend: `https://ecovacs-app.kl5dxx.easypanel.host/api`
- [ ] **NÃO** incluir `/v1` no final (o código já adiciona)
- [ ] Fazer commit e push
- [ ] Easypanel vai fazer rebuild automaticamente
- [ ] Testar login/registro no domínio customizado

Depois do deploy:

- [ ] Abrir DevTools → Network
- [ ] Tentar fazer login/registro
- [ ] Verificar se a requisição vai para a URL correta do backend
- [ ] Se não funcionar, verificar se o rebuild usou as variáveis certas

## 🆘 Problema Comum: "Ainda usa localhost"

**Sintoma:**
```
Access to XMLHttpRequest at 'http://localhost:8000/api/v1/auth/login'
from origin 'https://clickads.pro' has been blocked by CORS
```

**Causa:** O build foi feito com `VITE_API_URL` apontando para localhost.

**Solução:**
1. Verificar variáveis de ambiente no Easypanel
2. Forçar rebuild: fazer um commit vazio e push
   ```bash
   git commit --allow-empty -m "force rebuild"
   git push
   ```
3. Aguardar o Easypanel fazer rebuild
4. Limpar cache do navegador (Ctrl+Shift+Delete)
5. Testar novamente

## 📊 Resumo

| Ambiente | Leitura do .env | Quando Muda |
|----------|----------------|-------------|
| **Desenvolvimento** | ⚡ Tempo real | Ao recarregar página |
| **Produção** | 📦 No build | Ao fazer rebuild |

**Regra de Ouro:**
- Backend (`APP_URL`, `DB_*`) → Pode mudar sem rebuild
- Frontend (`VITE_*`) → **PRECISA rebuild** para aplicar mudanças

## 🔗 Configuração Atual

### Local (desenvolvimento)
```bash
VITE_API_URL="http://localhost:8000/api"
```

### Produção (Easypanel) - Configure no painel:
```bash
VITE_API_URL="https://ecovacs-app.kl5dxx.easypanel.host/api"
```

### Frontend (domínio customizado)
```bash
FRONTEND_URL="https://clickads.pro"  # Só afeta backend (links de indicação)
```

---

**Conclusão:** ✅ Sim, a página de registro usa o `.env`, mas você precisa garantir que `VITE_API_URL` está configurado corretamente **ANTES** do build em produção!




