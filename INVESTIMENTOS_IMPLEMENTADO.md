# ✅ Sistema de Investimentos Implementado

## 📋 Resumo

Sistema completo de contratação de planos implementado com validações de saldo, limite de compras e redireciona mento automático para depósito quando necessário.

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `cycles`

Armazena os investimentos/contratos dos usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | ID único do ciclo |
| `user_id` | bigint | FK para users |
| `plan_id` | bigint | FK para plans |
| `amount` | numeric(18,2) | Valor investido |
| `type` | enum | `DAILY` ou `END_CYCLE` |
| `duration_days` | integer | Duração em dias |
| `started_at` | timestamp | Data de início |
| `ends_at` | timestamp | Data de término |
| `status` | enum | `ACTIVE`, `FINISHED`, `CANCELLED` |
| `is_first_purchase` | boolean | Primeira compra do usuário? |
| `daily_income` | numeric(18,2) | Renda diária (null para END_CYCLE) |
| `total_return` | numeric(18,2) | Retorno total esperado |
| `total_paid` | numeric(18,2) | Total já pago |
| `days_paid` | integer | Dias já pagos |
| `last_payment_at` | timestamp | Última data de pagamento |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

**Índices:**
- ✅ `cycles_user_id_index`
- ✅ `cycles_plan_id_index`
- ✅ `cycles_status_index`
- ✅ `cycles_type_index`
- ✅ `cycles_status_ends_at_index` (composto)

---

## 🔧 Backend - Arquivos Criados

### 1. Migration: `2025_11_06_235552_create_cycles_table.php`
Cria a tabela `cycles` com todos os campos e índices.

### 2. Model: `app/Models/Cycle.php`

**Funcionalidades:**
- ✅ Casts automáticos de tipos
- ✅ Relacionamentos: `user()`, `plan()`
- ✅ Scopes: `active()`, `finished()`, `byType()`
- ✅ Métodos úteis:
  - `isActive()` - Verifica se está ativo
  - `isFinished()` - Verifica se finalizou
  - `getProgressPercentage()` - Calcula progresso (%)
  - `canReceivePaymentToday()` - Verifica se pode receber pagamento

### 3. FormRequest: `app/Http/Requests/Investment/CreateInvestmentRequest.php`
Valida os dados de entrada:
- `plan_id` - obrigatório, existe na tabela plans

### 4. Controller: `app/Http/Controllers/API/V1/InvestmentController.php`

**Endpoints implementados:**

#### POST /api/v1/investments - Criar investimento

**Validações:**
1. ✅ Plano existe e está ativo
2. ✅ Usuário tem saldo suficiente em `balance`
3. ✅ Não excedeu limite de compras simultâneas
4. ✅ Calcula se é primeira compra

**Processo:**
1. Deduz valor do `balance` do usuário
2. Incrementa `total_invested`
3. Cria ciclo com status `ACTIVE`
4. Retorna dados do ciclo criado

**Respostas de Erro:**

```json
// Saldo insuficiente
{
  "message": "Saldo insuficiente",
  "error": "INSUFFICIENT_BALANCE",
  "data": {
    "required": 50.00,
    "available": 30.00,
    "missing": 20.00,
    "redirect": "/deposit"
  }
}

// Limite atingido
{
  "message": "Você atingiu o limite...",
  "error": "PURCHASE_LIMIT_REACHED",
  "data": {
    "max_purchases": 1,
    "current_active": 1
  }
}
```

#### GET /api/v1/investments - Listar investimentos

**Query params:**
- `status` - `active`, `finished`, `all`

#### GET /api/v1/investments/{id} - Detalhes de um investimento

#### GET /api/v1/investments/stats - Estatísticas

---

## 🚀 Frontend - Arquivos Modificados

### 1. `resources/js/lib/api.ts`

Adicionado `investmentsAPI`:
```typescript
export const investmentsAPI = {
  create: (planId: number) => api.post('/investments', { plan_id: planId }),
  getAll: (status?: 'active' | 'finished' | 'all') => 
    api.get('/investments', { params: { status } }),
  getById: (id: number) => api.get(`/investments/${id}`),
  getStats: () => api.get('/investments/stats'),
};
```

### 2. `resources/js/components/ProductCard.tsx`

**Novos recursos:**
- ✅ Botão "Investir Agora" com ícone
- ✅ Modal de confirmação com resumo
- ✅ Loading state durante processamento
- ✅ Tratamento de erros específicos
- ✅ Redirecionamento automático para `/deposit` quando sem saldo
- ✅ Toasts informativos
- ✅ Atualização automática do saldo do usuário

**Estados tratados:**
1. **Sucesso:** Toast verde + atualiza saldo
2. **Saldo insuficiente:** Toast vermelho + redireciona após 2s
3. **Limite atingido:** Toast vermelho com informação
4. **Erro genérico:** Toast vermelho

---

## 💡 Fluxo de Compra

```
┌─────────────────────────────────────────────────────────┐
│  1. Usuário clica em "Investir Agora"                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. Abre modal de confirmação                           │
│     - Mostra resumo do plano                            │
│     - Mostra saldo atual                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. Usuário confirma investimento                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. Backend valida:                                     │
│     ✅ Plano ativo?                                     │
│     ✅ Saldo suficiente?                                │
│     ✅ Limite de compras OK?                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├──► ❌ Validação falhou
                     │    └─► Toast de erro
                     │        └─► Redireciona para /deposit (se sem saldo)
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  5. ✅ Validação OK - Processar:                        │
│     - Deduz valor do balance                            │
│     - Incrementa total_invested                         │
│     - Cria ciclo ACTIVE                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  6. Retorna sucesso                                     │
│     - Toast verde "Plano contratado!"                   │
│     - Atualiza saldo do usuário                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Como Testar

### 1. Cenário: Compra com Sucesso

```bash
# Fazer login
POST /api/v1/auth/login
{
  "email": "admin@admin.com",
  "password": "admin123"
}

# Copiar token

# Listar planos
GET /api/v1/plans
Authorization: Bearer {token}

# Comprar plano (ID 1 - R$ 50,00)
POST /api/v1/investments
Authorization: Bearer {token}
{
  "plan_id": 1
}

# Resposta esperada: 201 Created
# Balance do usuário: R$ 10.000,00 → R$ 9.950,00
```

### 2. Cenário: Saldo Insuficiente

```bash
# Tentar comprar plano mais caro que o saldo disponível
POST /api/v1/investments
Authorization: Bearer {token}
{
  "plan_id": 6  # R$ 2.500,00
}

# Se balance < R$ 2.500,00
# Resposta: 422 com erro INSUFFICIENT_BALANCE
# Frontend redireciona para /deposit
```

### 3. Cenário: Limite de Compras Atingido

```bash
# Comprar plano que permite apenas 1 compra por vez
POST /api/v1/investments
{
  "plan_id": 1  # max_purchases = 1
}

# Tentar comprar novamente o mesmo plano
POST /api/v1/investments
{
  "plan_id": 1
}

# Resposta: 422 com erro PURCHASE_LIMIT_REACHED
```

### 4. Teste no Frontend

1. Acesse: `http://localhost:5173`
2. Faça login: `admin@admin.com` / `admin123`
3. Role até "Planos de Rendimento Progressivo"
4. Clique em **"Investir Agora"** em qualquer plano
5. Verifique o modal de confirmação
6. Clique em "Confirmar Investimento"
7. Aguarde o processamento
8. Veja o toast de sucesso
9. Verifique que o saldo foi atualizado

---

## 📊 Dados Atualizados

Após cada compra, os seguintes dados são atualizados:

### Usuário (`users` table):
- `balance` → Diminui pelo valor do plano
- `total_invested` → Aumenta pelo valor do plano

### Novo registro criado (`cycles` table):
- Todos os dados do ciclo/investimento
- Status: `ACTIVE`
- Datas calculadas automaticamente

---

## 🎯 Validações Implementadas

### Backend:

1. ✅ **Plano existe:** Verifica se plan_id existe e está ativo
2. ✅ **Saldo suficiente:** `user.balance >= plan.price`
3. ✅ **Limite de compras:** Conta ciclos ACTIVE do mesmo plano
4. ✅ **Primeira compra:** Detecta automaticamente
5. ✅ **Transação atômica:** Usa `DB::transaction()`

### Frontend:

1. ✅ **Confirmação obrigatória:** Modal antes de processar
2. ✅ **Loading state:** Desabilita botão durante processamento
3. ✅ **Feedback visual:** Toasts para cada cenário
4. ✅ **Redireciona mento inteligente:** Vai para /deposit se sem saldo
5. ✅ **Atualização automática:** Busca novos dados do usuário

---

## 🔐 Segurança

- ✅ Todas as rotas protegidas com `auth:sanctum`
- ✅ Validação server-side de todos os dados
- ✅ FormRequest para sanitização
- ✅ Transações do banco para atomicidade
- ✅ Apenas dono do investimento pode ver seus dados

---

## 📝 Rotas API

```
POST   /api/v1/investments              # Criar investimento
GET    /api/v1/investments              # Listar investimentos
GET    /api/v1/investments/{id}         # Detalhes
GET    /api/v1/investments/stats        # Estatísticas
```

---

## ✅ Status Final

- [x] Migration criada e executada
- [x] Model Cycle criado com métodos úteis
- [x] Controller completo com validações
- [x] Rotas API configuradas
- [x] Frontend com botão de compra
- [x] Modal de confirmação
- [x] Tratamento de erros
- [x] Redirecionamento para depósito
- [x] Validação de saldo
- [x] Validação de limite de compras
- [x] Atualização automática de saldos
- [x] Toasts informativos
- [x] Loading states
- [x] Documentação completa

**O sistema de investimentos está 100% funcional!** 🎉

---

## 🚀 Próximos Passos

Agora você pode:

1. ✅ Comprar planos diretamente da home
2. ✅ Ver limite de compras em tempo real
3. ✅ Receber alertas de saldo insuficiente
4. ✅ Ser redirecionado para depósito automaticamente
5. ✅ Ver seus investimentos ativos
6. ⏭️ Implementar página de "Meus Investimentos"
7. ⏭️ Implementar Jobs de pagamento diário
8. ⏭️ Implementar Jobs de finalização de ciclo
9. ⏭️ Implementar comissões de indicação

**Teste agora mesmo comprando um plano!** 🚀

