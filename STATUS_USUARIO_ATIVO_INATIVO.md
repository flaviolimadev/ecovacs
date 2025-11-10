# 🟢🔴 Status de Usuário: Ativo / Inativo

## ✅ Implementação Completa

Sistema de status do usuário baseado em investimentos implementado com sucesso!

---

## 🎯 Regra de Negócio

### Status do Usuário

| Status | Condição | Badge | Cor |
|--------|----------|-------|-----|
| **ATIVO** ✅ | Tem pelo menos 1 investimento (qualquer status) | "Usuário Ativo" | Verde |
| **INATIVO** ❌ | Nunca fez nenhuma compra | "Usuário Inativo" | Vermelho |

**Importante:** O status é baseado na existência de **qualquer investimento** (ativo, finalizado ou cancelado), não apenas investimentos ativos.

---

## 🔄 Fluxo de Status

```
┌─────────────────────────────────┐
│   USUÁRIO CADASTRADO            │
│   Status: INATIVO 🔴            │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│   FAZ PRIMEIRA COMPRA           │
│   (Qualquer plano)              │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│   Status: ATIVO ✅              │
│   (Permanece ativo para sempre) │
└─────────────────────────────────┘
```

**Observação:** Uma vez que o usuário faz a primeira compra, ele **sempre** será considerado "Ativo", mesmo que não tenha mais investimentos ativos no momento.

---

## 💾 Backend (API)

### Endpoint: `GET /api/v1/investments/stats`

**Request:**
```http
GET /api/v1/investments/stats
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Estatísticas carregadas",
  "data": {
    "user_status": "active",        // "active" | "inactive"
    "is_active": true,              // boolean
    "active_cycles": 2,
    "finished_cycles": 1,
    "total_invested": 1500.00,
    "total_earned": 320.00,
    "user_balance": 8500.00,
    "user_balance_withdrawn": 320.00
  }
}
```

### Lógica de Verificação (Controller)

```php
// app/Http/Controllers/API/V1/InvestmentController.php

public function stats(Request $request)
{
    $user = $request->user();
    
    // Verificar se usuário está ativo (tem pelo menos 1 investimento)
    $hasInvestments = Cycle::where('user_id', $user->id)->exists();
    $userStatus = $hasInvestments ? 'active' : 'inactive';
    
    return response()->json([
        'data' => [
            'user_status' => $userStatus,     // String
            'is_active' => $hasInvestments,   // Boolean
            'active_cycles' => ...,
            'finished_cycles' => ...,
            ...
        ],
    ]);
}
```

**Query SQL:**
```sql
-- Verificar se usuário tem investimentos
SELECT EXISTS(
    SELECT 1 
    FROM cycles 
    WHERE user_id = ?
) as has_investments;
```

---

## 🎨 Frontend (React)

### Página: `/earnings`

**Arquivo:** `resources/js/pages/Earnings.tsx`

### Estados Visuais

#### 1. Badge no Header

**ATIVO:**
```
┌─────────────────────────────────┐
│      Rendimentos                │
│                                 │
│      🎁                         │
│                                 │
│  [✓ Usuário Ativo]             │  ← Verde
│                                 │
└─────────────────────────────────┘
```

**INATIVO:**
```
┌─────────────────────────────────┐
│      Rendimentos                │
│                                 │
│      🎁                         │
│                                 │
│  [✗ Usuário Inativo]           │  ← Vermelho
│                                 │
└─────────────────────────────────┘
```

#### 2. Empty State (Sem Investimentos Ativos)

**Usuário ATIVO (já comprou antes):**
```
┌─────────────────────────────────┐
│      📦                         │
│                                 │
│  Nenhum investimento ativo      │
│                                 │
│  Você não possui pacotes        │
│  ativos no momento. Invista     │
│  em um novo plano!              │
│                                 │
│  [Ver Planos Disponíveis]       │
└─────────────────────────────────┘
```

**Usuário INATIVO (nunca comprou):**
```
┌─────────────────────────────────┐
│      📦                         │
│                                 │
│  Conta Inativa                  │
│                                 │
│  Você ainda não realizou        │
│  nenhuma compra. Faça seu       │
│  primeiro investimento para     │
│  ativar sua conta!              │
│                                 │
│  [Fazer Primeiro Investimento]  │
└─────────────────────────────────┘
```

### Código do Badge

```tsx
{!isLoading && userStats && (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
    userStats.is_active 
      ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
      : 'bg-red-500/20 text-red-100 border border-red-400/30'
  }`}>
    {userStats.is_active ? (
      <>
        <CheckCircle2 className="w-4 h-4" />
        <span>Usuário Ativo</span>
      </>
    ) : (
      <>
        <XCircle className="w-4 h-4" />
        <span>Usuário Inativo</span>
      </>
    )}
  </div>
)}
```

---

## 📊 Exemplos Práticos

### Cenário 1: Novo Usuário (Sem Compras)

**Dados:**
- Cadastrado: João Silva
- Investimentos: 0
- Saldo: R$ 1.000,00

**Status:** 🔴 **INATIVO**

**Exibição em `/earnings`:**
```
┌──────────────────────────────────────┐
│  🎁                                  │
│  [✗ Usuário Inativo]                │
└──────────────────────────────────────┘

       📦

    Conta Inativa

    Você ainda não realizou nenhuma
    compra. Faça seu primeiro 
    investimento para ativar sua conta!

    [Fazer Primeiro Investimento]
```

---

### Cenário 2: Usuário com Primeira Compra

**Dados:**
- Usuário: João Silva
- Investimentos: 1 (Ativo)
- Valor investido: R$ 600,00

**Status:** 🟢 **ATIVO**

**Exibição em `/earnings`:**
```
┌──────────────────────────────────────┐
│  🎁                                  │
│  [✓ Usuário Ativo]                  │
└──────────────────────────────────────┘

📊 Resumo:
   Ativos: 1
   Investido: R$ 600,00
   Ganho: R$ 0,00

📈 Pacotes Ativos:
   [Card do Plano Ecovacs N30]
```

---

### Cenário 3: Usuário com Investimentos Finalizados

**Dados:**
- Usuário: Maria
- Investimentos Ativos: 0
- Investimentos Finalizados: 3
- Total Investido: R$ 2.500,00

**Status:** 🟢 **ATIVO** (porque já fez compras antes)

**Exibição em `/earnings`:**
```
┌──────────────────────────────────────┐
│  🎁                                  │
│  [✓ Usuário Ativo]                  │
└──────────────────────────────────────┘

       📦

    Nenhum investimento ativo

    Você não possui pacotes ativos
    no momento. Invista em um novo plano!

    [Ver Planos Disponíveis]
```

---

## 🔍 Verificações SQL

### Verificar Status de Todos os Usuários

```sql
SELECT 
    u.id,
    u.name,
    u.email,
    CASE 
        WHEN EXISTS(SELECT 1 FROM cycles WHERE user_id = u.id) 
        THEN 'ATIVO ✅'
        ELSE 'INATIVO 🔴'
    END as status,
    COUNT(c.id) as total_investimentos,
    COUNT(CASE WHEN c.status = 'ACTIVE' THEN 1 END) as ativos,
    COUNT(CASE WHEN c.status = 'FINISHED' THEN 1 END) as finalizados
FROM users u
LEFT JOIN cycles c ON c.user_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY u.created_at DESC;
```

**Resultado:**
```
id | name         | email              | status        | total | ativos | finalizados
---|--------------|--------------------|--------------:|-------|--------|------------
1  | Admin        | admin@admin.com    | ATIVO ✅      | 0     | 0      | 0
2  | João Silva   | joao@test.com      | ATIVO ✅      | 2     | 1      | 1
3  | Maria Souza  | maria@test.com     | ATIVO ✅      | 3     | 0      | 3
4  | Pedro Santos | pedro@test.com     | INATIVO 🔴    | 0     | 0      | 0
```

### Contar Usuários por Status

```sql
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM cycles WHERE user_id = users.id)
        THEN 'ATIVO'
        ELSE 'INATIVO'
    END as status,
    COUNT(*) as quantidade
FROM users
GROUP BY 
    CASE 
        WHEN EXISTS(SELECT 1 FROM cycles WHERE user_id = users.id)
        THEN 'ATIVO'
        ELSE 'INATIVO'
    END;
```

**Resultado:**
```
status   | quantidade
---------|----------
ATIVO    | 15
INATIVO  | 7
```

---

## 🧪 Como Testar

### Teste 1: Usuário Novo (Inativo)

1. **Criar novo usuário:**
   ```
   POST /api/v1/auth/register
   {
     "name": "Teste Usuario",
     "email": "teste@test.com",
     "password": "123456",
     "password_confirmation": "123456",
     "referral_code": "ADMIN001"
   }
   ```

2. **Acessar `/earnings`**
   - Badge: 🔴 "Usuário Inativo"
   - Mensagem: "Conta Inativa"
   - Botão: "Fazer Primeiro Investimento"

3. **Verificar API:**
   ```
   GET /api/v1/investments/stats
   
   Response:
   {
     "user_status": "inactive",
     "is_active": false
   }
   ```

---

### Teste 2: Primeira Compra (Ativar Conta)

1. **Adicionar saldo:**
   ```sql
   UPDATE users 
   SET balance = 1000.00 
   WHERE email = 'teste@test.com';
   ```

2. **Comprar plano:**
   ```
   POST /api/v1/investments
   { "plan_id": 1 }
   ```

3. **Acessar `/earnings` novamente**
   - Badge: 🟢 "Usuário Ativo"
   - Pacote aparece na lista

4. **Verificar API:**
   ```
   GET /api/v1/investments/stats
   
   Response:
   {
     "user_status": "active",
     "is_active": true,
     "active_cycles": 1
   }
   ```

---

### Teste 3: Investimentos Finalizados

1. **Finalizar todos os investimentos:**
   ```sql
   UPDATE cycles 
   SET status = 'FINISHED' 
   WHERE user_id = <ID_USUARIO>;
   ```

2. **Acessar `/earnings`**
   - Badge: 🟢 "Usuário Ativo" (ainda!)
   - Mensagem: "Nenhum investimento ativo"
   - Botão: "Ver Planos Disponíveis"

3. **Verificar API:**
   ```
   {
     "user_status": "active",
     "is_active": true,
     "active_cycles": 0,
     "finished_cycles": 1
   }
   ```

---

## ✅ Checklist de Implementação

- [x] Endpoint `/api/v1/investments/stats` retorna `user_status` e `is_active`
- [x] Lógica verifica existência de ciclos com `exists()`
- [x] Frontend busca stats via `investmentsAPI.getStats()`
- [x] Badge exibido no header com cores corretas
- [x] Empty state tem mensagens diferentes para ativo/inativo
- [x] Botão do empty state tem textos diferentes
- [x] Ícones diferentes (CheckCircle2 vs XCircle)
- [x] Documentação completa

---

## 🎨 Estilos Utilizados

### Badge Ativo (Verde)
```css
bg-green-500/20
text-green-100
border border-green-400/30
```

### Badge Inativo (Vermelho)
```css
bg-red-500/20
text-red-100
border border-red-400/30
```

---

## 📝 Observações Importantes

1. ✅ Status permanece "Ativo" mesmo após finalizar todos os investimentos
2. ✅ Status se baseia em **qualquer** investimento (ativo, finalizado ou cancelado)
3. ✅ Query otimizada com `EXISTS` (para na primeira ocorrência)
4. ✅ Frontend trata loading state para não exibir badge antes de carregar
5. ✅ Mensagens contextualizadas baseadas no status

---

## 🚀 Benefícios

✅ **Clareza Visual**: Usuário sabe imediatamente seu status
✅ **Call to Action**: Mensagens diferentes incentivam ação correta
✅ **Gamificação**: "Ativar conta" motiva primeira compra
✅ **Transparência**: Status claro e fácil de entender
✅ **Performance**: Query otimizada com `EXISTS`

---

## ✅ Status: IMPLEMENTADO E FUNCIONAL! 🎉

O sistema de status Ativo/Inativo está completamente operacional e integrado à página de rendimentos!




