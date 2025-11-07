# 🔍 Debug: Página /earnings não mostra planos

## Problema
A página `/earnings` não está exibindo os planos comprados, mesmo tendo investimentos no banco de dados.

## Passos para Verificar

### 1️⃣ Verificar se existem investimentos no banco

Execute no terminal (dentro da pasta `app/`):

```bash
php artisan tinker
```

Depois, dentro do tinker:

```php
// Ver total de ciclos (investimentos)
\App\Models\Cycle::count();

// Ver todos os ciclos
\App\Models\Cycle::with('plan', 'user')->get();

// Ver ciclos de um usuário específico (substitua 1 pelo ID do usuário)
\App\Models\Cycle::where('user_id', 1)->get();

// Ver status dos ciclos
\App\Models\Cycle::select('id', 'user_id', 'status', 'plan_id')->get();
```

### 2️⃣ Verificar logs da API

Quando você acessar a página `/earnings`, o backend vai gerar logs. Veja em:

```bash
tail -f storage/logs/laravel.log
```

Procure por:
- `"Buscando investimentos"` - mostra qual usuário e filtro
- `"Investimentos encontrados"` - mostra quantos foram encontrados

### 3️⃣ Testar a API diretamente

Teste o endpoint manualmente (substitua o token):

```bash
# Linux/Mac
curl -H "Authorization: Bearer SEU_TOKEN_AQUI" \
     http://localhost:8000/api/v1/investments?status=active

# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/investments?status=active" `
  -Headers @{"Authorization"="Bearer SEU_TOKEN_AQUI"}
```

### 4️⃣ Verificar o console do navegador

Abra o DevTools (F12) e vá na aba **Network**. Quando acessar `/earnings`:

1. Procure pela requisição `investments?status=active`
2. Veja a resposta (Response) - deve ter um array `data`
3. Verifique se o `data` está vazio `[]` ou tem conteúdo

### 5️⃣ Verificar autenticação

No console do navegador (F12 → Console), execute:

```javascript
// Ver se o token existe
console.log(localStorage.getItem('auth_token'));

// Ver dados do usuário
console.log(JSON.parse(localStorage.getItem('user') || '{}'));
```

## Possíveis Causas

### ❌ Causa 1: Status incorreto
Os ciclos podem estar com status diferente de `ACTIVE`:
- `FINISHED` - ciclo finalizado
- `CANCELLED` - ciclo cancelado

**Solução:**
```sql
-- Ver status dos ciclos
SELECT id, user_id, status, plan_id FROM cycles;

-- Atualizar status se necessário (CUIDADO!)
UPDATE cycles SET status = 'ACTIVE' WHERE id = SEU_ID_AQUI;
```

### ❌ Causa 2: Usuário errado
Você pode estar logado com um usuário diferente do que tem os investimentos.

**Solução:** Verifique o `user_id` dos ciclos e compare com o usuário logado.

### ❌ Causa 3: Plano deletado
Se o plano foi deletado, o relacionamento `cycle->plan` pode falhar.

**Solução:**
```sql
-- Verificar se os planos existem
SELECT c.id, c.plan_id, p.name 
FROM cycles c 
LEFT JOIN plans p ON c.plan_id = p.id 
WHERE c.user_id = SEU_USER_ID;
```

### ❌ Causa 4: Cache do navegador
O frontend pode estar usando dados em cache.

**Solução:**
- Abra o DevTools (F12)
- Vá em **Application** → **Storage**
- Clique em **Clear site data**
- Recarregue a página (Ctrl+Shift+R)

## 🔧 Soluções Rápidas

### Criar um investimento de teste manualmente

```bash
php artisan tinker
```

```php
// Buscar primeiro usuário
$user = \App\Models\User::first();

// Buscar primeiro plano
$plan = \App\Models\Plan::first();

// Criar ciclo/investimento
$cycle = \App\Models\Cycle::create([
    'user_id' => $user->id,
    'plan_id' => $plan->id,
    'amount' => 50.00,
    'type' => 'DAILY',
    'duration_days' => 20,
    'started_at' => now(),
    'ends_at' => now()->addDays(20),
    'status' => 'ACTIVE',
    'is_first_purchase' => true,
    'daily_income' => 5.00,
    'total_return' => 100.00,
    'total_paid' => 0,
    'days_paid' => 0,
]);

echo "Ciclo criado: ID {$cycle->id}";
```

### Limpar cache do Laravel

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

## 📊 Estrutura Esperada da Resposta

A API deve retornar algo como:

```json
{
  "message": "Investimentos carregados com sucesso",
  "data": [
    {
      "id": 1,
      "plan_id": 1,
      "plan_name": "🤖 Ecovacs Deebot T8 Robot",
      "plan_image": "/assets/ecovacs-t8.jpg",
      "amount": 50.00,
      "type": "DAILY",
      "duration_days": 20,
      "daily_income": 5.00,
      "total_return": 100.00,
      "total_paid": 0.00,
      "days_paid": 0,
      "started_at": "2025-01-01T00:00:00.000000Z",
      "ends_at": "2025-01-21T00:00:00.000000Z",
      "last_payment_at": null,
      "status": "ACTIVE",
      "progress": 0,
      "is_first_purchase": true
    }
  ]
}
```

## 🆘 Se nada funcionar

Me envie as seguintes informações:

1. **Resultado do tinker:**
   ```php
   \App\Models\Cycle::count(); // Resultado: ?
   ```

2. **Log da requisição:** (cópia do storage/logs/laravel.log)

3. **Resposta da API:** (do DevTools → Network → investments?status=active)

4. **User ID logado:** (console: `JSON.parse(localStorage.getItem('user')).id`)

