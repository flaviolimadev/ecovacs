# ✅ Sistema de Extrato (Ledger) Implementado

## 🎯 Problema Resolvido

**Problema:** As compras e extratos não estavam sendo salvos no banco de dados.

**Causa:** A tabela `ledger` (extrato) não existia no banco de dados!

## 🔧 O Que Foi Criado

### 1. **Tabela `ledger`** - Extrato de Transações

Armazena TODAS as movimentações financeiras do usuário:

```sql
- id
- user_id (FK users)
- type (INVESTMENT, COMMISSION, EARNING, WITHDRAWAL, DEPOSIT)
- reference_type, reference_id (polimórfico - aponta para Cycle, Commission, etc)
- description (texto descritivo)
- amount (valor da transação)
- operation (CREDIT ou DEBIT)
- balance_before (saldo antes)
- balance_after (saldo depois)
- created_at, updated_at
```

### 2. **Tabela `earnings`** - Rendimentos

Armazena os rendimentos diários e de fim de ciclo:

```sql
- id
- cycle_id (FK cycles)
- user_id (FK users)
- reference_date (data de referência)
- value (valor do rendimento)
- type (DAILY, END_LUMP_SUM, CAPITAL_RETURN)
- is_paid (boolean)
- paid_at (timestamp)
- created_at, updated_at
```

### 3. **Modelo `Ledger`**

```php
App\Models\Ledger
- fillable
- casts (amount, balance_before, balance_after como decimal)
- Relacionamento: user(), reference() (polimórfico)
- Scopes: byType(), byOperation()
```

### 4. **Modelo `Earning`**

```php
App\Models\Earning
- fillable
- casts (value como decimal, reference_date como date)
- Relacionamentos: cycle(), user()
- Scopes: paid(), pending(), byType()
```

## 📝 Quando o Ledger é Criado

### ✅ Ao Comprar um Plano

Quando um usuário investe em um plano:

```php
Ledger::create([
    'user_id' => $user->id,
    'type' => 'INVESTMENT',
    'reference_type' => Cycle::class,
    'reference_id' => $cycle->id,
    'description' => "Investimento no plano: {$plan->name}",
    'amount' => $price,
    'operation' => 'DEBIT', // Débito no saldo de investimento
    'balance_before' => $balanceBefore,
    'balance_after' => $user->balance,
]);
```

**Arquivo:** `app/Http/Controllers/API/V1/InvestmentController.php` (linha ~105-116)

### ✅ Ao Receber Comissão

Quando uma comissão é gerada:

```php
Ledger::create([
    'user_id' => $upline->id,
    'type' => 'COMMISSION',
    'reference_type' => Commission::class,
    'reference_id' => $commission->id,
    'description' => $commission->description,
    'amount' => $commissionAmount,
    'operation' => 'CREDIT', // Crédito no saldo de saque
    'balance_before' => $balanceWithdrawnBefore,
    'balance_after' => $upline->balance_withdrawn,
]);
```

**Arquivo:** `app/Actions/ProcessReferralCommissions.php` (linha ~99-110)

### 🔜 Futuramente (quando implementar)

- **EARNING**: Quando o job diário processar rendimentos
- **WITHDRAWAL**: Quando o usuário solicitar saque
- **DEPOSIT**: Quando o usuário depositar dinheiro

## 📊 Endpoint de Extrato (Statement)

### **GET `/api/v1/profile/statement`**

**Query Params:**
- `per_page` (int, default: 20) - Paginação
- `type` (string, opcional) - Filtrar por tipo (INVESTMENT, COMMISSION, EARNING, etc)

**Resposta:**

```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-11-07 01:30:00",
      "type": "investment",
      "type_label": "Investimento",
      "description": "Investimento no plano: 🤖 Ecovacs Deebot T8 Robot",
      "amount": 50.00,
      "operation": "DEBIT",
      "balance_before": 10000.00,
      "balance_after": 9950.00,
      "status": "completed",
      "status_label": "Concluído"
    },
    {
      "id": 2,
      "date": "2025-11-07 01:30:05",
      "type": "commission",
      "type_label": "Comissão",
      "description": "Comissão de indicação (Nível 1) da compra de João Silva (Plano: T8 Robot)",
      "amount": 7.50,
      "operation": "CREDIT",
      "balance_before": 5000.00,
      "balance_after": 5007.50,
      "status": "completed",
      "status_label": "Concluído"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 2
  },
  "summary": {
    "total_credits": 7.50,
    "total_debits": 50.00,
    "net_balance": -42.50,
    "balance": 9950.00,
    "balance_withdrawn": 5007.50,
    "total_transactions": 2
  }
}
```

## 🧪 Testar o Extrato

### 1. Faça Login

```bash
POST /api/v1/auth/login
{
  "email": "admin@admin.com",
  "password": "admin123"
}
```

### 2. Compre um Plano

```bash
POST /api/v1/investments
{
  "plan_id": 1
}
```

### 3. Veja o Extrato

```bash
GET /api/v1/profile/statement
```

Você deve ver:
- ✅ 1 transação de DÉBITO (investimento de R$ 50)
- ✅ Se houver indicador, ele recebe comissão (CRÉDITO)

## 📁 Arquivos Modificados/Criados

### Migrations
- ✅ `2025_11_07_012446_create_ledger_table.php`
- ✅ `2025_11_07_012509_create_earnings_table.php`

### Models
- ✅ `app/Models/Ledger.php`
- ✅ `app/Models/Earning.php`

### Controllers
- ✅ `app/Http/Controllers/API/V1/InvestmentController.php` - Registra investimento no ledger
- ✅ `app/Http/Controllers/API/V1/ProfileController.php` - Método `statement()` busca do ledger

### Actions
- ✅ `app/Actions/ProcessReferralCommissions.php` - Registra comissões no ledger

### Seeders
- ✅ `database/seeders/DatabaseSeeder.php` - Corrigido para chamar seeders personalizados

## 🔍 Verificar no Banco

```sql
-- Ver todas as transações do admin
SELECT * FROM ledger WHERE user_id = 1 ORDER BY created_at DESC;

-- Ver saldo atual do admin
SELECT balance, balance_withdrawn FROM users WHERE id = 1;

-- Ver investimentos do admin
SELECT * FROM cycles WHERE user_id = 1;

-- Ver comissões recebidas pelo admin
SELECT * FROM commissions WHERE user_id = 1;
```

## ✨ Benefícios

1. ✅ **Rastreamento Completo** - Toda movimentação financeira é registrada
2. ✅ **Auditoria** - Saldo antes/depois de cada transação
3. ✅ **Transparência** - Usuário vê todo histórico de transações
4. ✅ **Polimórfico** - Uma tabela para todas as transações (investimento, comissão, rendimento, saque)
5. ✅ **Filtros** - Pode filtrar por tipo de transação
6. ✅ **Paginação** - Lida com milhares de transações
7. ✅ **Resumo** - Total de créditos, débitos e balanço líquido

## 🚀 Próximos Passos

Para tornar o sistema completo, ainda precisamos implementar:

1. **Job de Rendimentos Diários** (`ApplyDailyYieldJob`)
   - Processar ciclos ativos
   - Criar earnings diários
   - Registrar no ledger como EARNING

2. **Job de Fim de Ciclo** (`FinalizeCycleWithCapitalReturnJob`)
   - Finalizar ciclos vencidos
   - Devolver capital (modalidade 2)
   - Registrar no ledger

3. **Sistema de Saques** (`WithdrawalsController`)
   - Validar janelas e limites
   - Processar saques
   - Registrar no ledger como WITHDRAWAL

4. **Sistema de Depósitos** (se houver)
   - Permitir depósitos
   - Registrar no ledger como DEPOSIT

## 📝 Notas Técnicas

- **Transação Atômica**: Todos os registros no ledger são feitos dentro de `DB::transaction()`
- **Decimal Precision**: Valores monetários usam `decimal(18, 2)`
- **Índices**: Tabela ledger tem índices em `user_id`, `type`, `created_at` para queries rápidas
- **Relacionamento Polimórfico**: `reference_type` e `reference_id` permitem referenciar qualquer modelo (Cycle, Commission, Earning, etc)

---

**Data:** 2025-11-07 01:30:00
**Commit:** Próximo push
**Status:** ✅ IMPLEMENTADO E TESTADO











