# 🔴 Erro no Registro: insertBefore + Connection Timeout

## 📊 Análise dos Erros

Você está enfrentando **2 erros diferentes**:

### 1. ❌ Erro DOM (React)
```
NotFoundError: Failed to execute 'insertBefore' on 'Node'
```

**Causa:** Provavelmente uma extensão do navegador ou conflito entre `Toaster` e `Sonner`.

### 2. ❌ Erro de Conexão (Backend)
```
POST https://ecovacs-app.kl5dxx.easypanel.host/api/v1/auth/register net::ERR_CONNECTION_TIMED_OUT
```

**Causa:** O backend **não está respondendo** ou há um problema de rede/configuração.

## 🔥 PROBLEMA PRINCIPAL: Backend com Timeout

### O que significa `ERR_CONNECTION_TIMED_OUT`?

O navegador tentou se conectar ao backend por ~30 segundos e **não conseguiu**. Isso pode acontecer por:

1. ✅ **Backend está offline/travado** (mais provável)
2. ✅ **Firewall bloqueando** a conexão
3. ✅ **Rota incorreta** no Laravel
4. ✅ **CORS mal configurado** (mas seria outro erro)
5. ✅ **Timeout na migration/seeder** (banco travou)

## 🔍 Como Diagnosticar

### 1. Verificar se o Backend está Rodando

No Easypanel, veja os logs do container:

```bash
# Ver logs em tempo real
docker logs -f <container-name>

# Ou no painel do Easypanel: Logs → View Logs
```

**Procure por:**
- ✅ "Servidor iniciando na porta 8000..."
- ❌ Erros de banco de dados
- ❌ Migrations travadas
- ❌ Memória/CPU estourados

### 2. Testar Diretamente a API

Teste se o backend responde:

```bash
# Teste 1: Backend está vivo?
curl https://ecovacs-app.kl5dxx.easypanel.host/up

# Teste 2: Rota de registro existe?
curl -X OPTIONS https://ecovacs-app.kl5dxx.easypanel.host/api/v1/auth/register

# Teste 3: Fazer registro manual
curl -X POST https://ecovacs-app.kl5dxx.easypanel.host/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@teste.com",
    "phone": "11999999999",
    "password": "123456",
    "password_confirmation": "123456",
    "referral_code": "ADMIN001"
  }'
```

**Respostas esperadas:**
- ✅ 200/201: Funcionou!
- ❌ Timeout: Backend offline ou travado
- ❌ 500: Erro no Laravel (ver logs)
- ❌ 422: Validação falhou (ok, backend está vivo)

### 3. Verificar Migrations e Seeders

As migrations/seeders podem ter **travado o banco**:

```bash
# No Easypanel, shell do container:
php artisan migrate:status

# Se travou, tente:
php artisan migrate --force

# Verificar banco:
php artisan db:show
```

### 4. Verificar Recursos do Container

No Easypanel:
- **CPU:** Se estiver 100%, pode estar travado
- **Memória:** Se estiver cheia, pode estar em crash loop
- **Restart Count:** Se estiver reiniciando constantemente, há erro fatal

## 🔧 Soluções

### Solução 1: Reiniciar o Backend

No Easypanel:
1. **Services** → Seu serviço
2. **Actions** → **Restart**
3. Aguardar ~30-60 segundos
4. Verificar logs

### Solução 2: Aumentar Timeout do start.sh

O `start.sh` espera 30 segundos pelo banco. Se o banco for lento, pode travar:

```bash
# start.sh (linha 16-24)
echo "⏳ Aguardando banco de dados..."
for i in {1..60}; do  # ← Aumentar de 30 para 60
    if php artisan db:show &>/dev/null; then
        echo "✅ Banco de dados conectado!"
        break
    fi
    echo "Tentativa $i/60..."
    sleep 2
done
```

### Solução 3: Rodar Migrations Manualmente

Às vezes as migrations travam no deploy automático:

```bash
# No shell do container (Easypanel):
php artisan migrate:fresh --seed --force

# ⚠️ CUIDADO: Isso APAGA os dados! 
# Use apenas em dev ou primeira vez

# Para produção (adiciona novas migrations):
php artisan migrate --force
```

### Solução 4: Verificar Conexão do Banco

```bash
# No container Laravel:
php artisan tinker

# Dentro do tinker:
DB::connection()->getPdo();
// Se funcionar, banco OK
// Se der erro, problema na conexão
```

**Variáveis de ambiente a verificar:**
```bash
DB_CONNECTION=pgsql
DB_HOST=ecovacs_bancodados  # ← Nome do serviço no Easypanel
DB_PORT=5432
DB_DATABASE=ecovacs
DB_USERNAME=postgres
DB_PASSWORD=98d5a8481623318d0f4a
DB_SSLMODE=disable  # ← Importante!
```

### Solução 5: Desabilitar Seeders no Deploy

Se os seeders estão travando, comente temporariamente:

```bash
# start.sh (linhas 34-37)
# Seeders (apenas se tabelas estiverem vazias)
# echo "👤 Verificando seeders..."
# php artisan db:seed --class=AdminUserSeeder --force || true
# php artisan db:seed --class=PlansSeeder --force || true
```

Faça commit e push. Depois rode os seeders manualmente.

## 🐛 Solução para o Erro `insertBefore`

Esse é um **erro secundário** (causado pelo primeiro erro). Mas pode ser resolvido:

### Opção 1: Desabilitar Extensões do Navegador

Teste em **modo anônimo/privado** do navegador:
- Chrome: `Ctrl+Shift+N`
- Firefox: `Ctrl+Shift+P`

Se funcionar, uma extensão está interferindo (provavelmente React DevTools, bloqueador de ads, etc).

### Opção 2: Usar Apenas um Sistema de Toast

O `app.tsx` tem **dois sistemas de toast** (Toaster e Sonner). Isso pode causar conflito:

```tsx
// app.tsx (linhas 26-27)
<Toaster />
<Sonner />  // ← Remover este?
```

**Escolha um:**
- `Toaster` = Shadcn/UI Toast (recomendado)
- `Sonner` = Alternativa mais simples

### Opção 3: Garantir que o ToastViewport Existe

Adicione o portal do toast no `index.html` ou `app.blade.php`:

```html
<body>
  <div id="app"></div>
  <div id="toast-viewport"></div> <!-- ← Adicionar -->
  @vite('resources/js/app.tsx')
</body>
```

## 📋 Checklist de Resolução

Siga nesta ordem:

1. **Verificar se o backend está online:**
   - [ ] Ver logs no Easypanel
   - [ ] Testar `curl https://ecovacs-app.kl5dxx.easypanel.host/up`
   - [ ] Ver CPU/Memória do container

2. **Se backend estiver offline:**
   - [ ] Reiniciar o serviço
   - [ ] Verificar conexão com banco de dados
   - [ ] Rodar migrations manualmente
   - [ ] Ver logs de erro

3. **Se backend estiver online mas dá timeout:**
   - [ ] Verificar CORS (`config/cors.php`)
   - [ ] Verificar variáveis de ambiente (`VITE_API_URL`)
   - [ ] Testar com `curl` direto
   - [ ] Limpar cache do navegador

4. **Resolver o erro insertBefore:**
   - [ ] Testar em modo anônimo (sem extensões)
   - [ ] Remover `<Sonner />` do `app.tsx`
   - [ ] Verificar console por outros erros

## 🆘 Se Nada Funcionar

### 1. Deploy Limpo

```bash
# 1. Fazer backup do banco
pg_dump -h host -U user -d database > backup.sql

# 2. No Easypanel: Delete e recrie o serviço

# 3. Configure variáveis de ambiente novamente

# 4. Deploy
git push
```

### 2. Verificar Recursos

Pode ser que o container não tem recursos suficientes:
- Memória mínima: 512MB
- CPU: Pelo menos 0.5 cores

### 3. Ver Logs Completos

No Easypanel, baixe os logs completos e procure por:
```
ERROR
FATAL
Timeout
Connection refused
```

## 📊 Resumo

| Erro | Causa Provável | Prioridade |
|------|----------------|------------|
| `ERR_CONNECTION_TIMED_OUT` | Backend offline/travado | 🔴 ALTA |
| `insertBefore` | Extensão do navegador/toast duplo | 🟡 BAIXA |

**Foco:** Resolver o timeout primeiro! O erro do React é consequência.

---

**Próximo Passo:** Ver os logs do backend no Easypanel e me envie o output!




