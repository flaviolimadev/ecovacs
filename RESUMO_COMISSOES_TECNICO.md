# 📋 Resumo Técnico - Sistema de Comissões MLM

## 🎯 Objetivo Alcançado

Implementar sistema de comissões de marketing multinível que distribui automaticamente valores para até 3 níveis de uplines quando um usuário faz uma compra.

---

## 📊 Regras de Negócio Implementadas

### Comissões por Tipo de Compra

| Tipo de Compra | Nível 1 | Nível 2 | Nível 3 | Total |
|---------------|---------|---------|---------|-------|
| **Primeira Compra** | 15% | 2% | 1% | 18% |
| **Compras Subsequentes** | 8% | 2% | 1% | 11% |

### Destino do Valor
- ✅ Valor creditado em: **`balance_withdrawn`** (saldo de saque)
- ✅ Atualizado também: **`total_earned`**
- ✅ Registro criado em: **`commissions`** (tabela)

---

## 🗄️ Estrutura de Dados

### Tabela: `commissions`

```sql
CREATE TABLE commissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,              -- Quem recebeu a comissão
    from_user_id BIGINT NOT NULL,         -- Quem fez a compra
    cycle_id BIGINT NOT NULL,             -- Ciclo que gerou a comissão
    level INTEGER NOT NULL,               -- 1, 2 ou 3
    amount DECIMAL(18,2) NOT NULL,        -- Valor da comissão
    purchase_amount DECIMAL(18,2) NOT NULL, -- Valor da compra
    percentage DECIMAL(5,2) NOT NULL,     -- % aplicado (15.00, 8.00, etc)
    type ENUM('FIRST_PURCHASE', 'SUBSEQUENT_PURCHASE'),
    description TEXT,                     -- Para extrato
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cycle_id) REFERENCES cycles(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_from_user_id (from_user_id),
    INDEX idx_cycle_id (cycle_id),
    INDEX idx_level (level),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);
```

---

## 🏗️ Arquitetura

### 1. Model: `Commission`
```php
// app/Models/Commission.php

class Commission extends Model
{
    protected $fillable = [
        'user_id', 'from_user_id', 'cycle_id', 'level',
        'amount', 'purchase_amount', 'percentage', 
        'type', 'description'
    ];
    
    // Relacionamentos
    public function user(): BelongsTo; // Quem recebeu
    public function fromUser(): BelongsTo; // Quem comprou
    public function cycle(): BelongsTo; // Ciclo origem
}
```

### 2. Action: `ProcessReferralCommissions`
```php
// app/Actions/ProcessReferralCommissions.php

class ProcessReferralCommissions
{
    private const FIRST_PURCHASE_RATES = [1 => 15, 2 => 2, 3 => 1];
    private const SUBSEQUENT_PURCHASE_RATES = [1 => 8, 2 => 2, 3 => 1];
    
    public function execute(Cycle $cycle): array
    {
        // 1. Determina tipo de compra
        // 2. Percorre árvore (users.referred_by)
        // 3. Para cada upline (até 3 níveis):
        //    - Calcula comissão
        //    - Cria registro em commissions
        //    - Credita em balance_withdrawn
        //    - Atualiza total_earned
        // 4. Retorna resumo
    }
}
```

### 3. Controller: `InvestmentController@store`
```php
// app/Http/Controllers/API/V1/InvestmentController.php

public function store(CreateInvestmentRequest $request)
{
    DB::transaction(function () {
        // 1. Validar saldo
        // 2. Validar limite de compras
        // 3. Criar cycle
        // 4. Debitar balance
    });
    
    // 5. Processar comissões (APÓS commit)
    try {
        $processor = new ProcessReferralCommissions();
        $commissionsData = $processor->execute($cycle);
    } catch (\Exception $e) {
        // Log erro, mas não falha a compra
    }
    
    // 6. Retornar resposta com dados das comissões
}
```

---

## 🔄 Fluxo de Execução

```
[POST /api/v1/investments]
         │
         ↓
[InvestmentController@store]
         │
         ├─ Validações
         │  ├─ Saldo suficiente?
         │  ├─ Limite de compras?
         │  └─ Plano ativo?
         │
         ├─ DB::transaction
         │  ├─ Criar Cycle
         │  ├─ Debitar user.balance
         │  └─ Atualizar total_invested
         │
         ├─ DB::commit
         │
         └─ ProcessReferralCommissions::execute
            │
            ├─ Determinar tipo (primeira/subsequente)
            │
            ├─ Loop: 3 níveis
            │  │
            │  ├─ Buscar upline (referred_by)
            │  │
            │  ├─ Calcular comissão
            │  │  amount = (price * percentage) / 100
            │  │
            │  ├─ Criar registro Commission
            │  │
            │  ├─ Creditar em upline.balance_withdrawn
            │  │
            │  ├─ Atualizar upline.total_earned
            │  │
            │  └─ Log sucesso
            │
            └─ Retornar resumo
```

---

## 📡 Endpoints

### POST /api/v1/investments
**Cria investimento + processa comissões**

Request:
```json
{
  "plan_id": 1
}
```

Response (sucesso):
```json
{
  "message": "Plano contratado com sucesso!",
  "data": {
    "cycle": { "id": 15, "amount": 1000.00, ... },
    "user_balance": {
      "balance": 9000.00,
      "balance_withdrawn": 0.00,
      "total_invested": 1000.00
    },
    "commissions": {
      "distributed": true,
      "total_amount": 180.00,
      "count": 3
    }
  }
}
```

### GET /api/v1/profile/statement
**Lista comissões recebidas**

Response:
```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-11-07 12:30:00",
      "type": "commission",
      "description": "Comissão de 15% - Nível 1 (Direto) - primeira compra de João",
      "amount": 150.00,
      "details": {
        "level": 1,
        "percentage": 15.00,
        "from_user": "João Silva",
        "purchase_amount": 1000.00,
        "commission_type": "Primeira Compra"
      }
    }
  ],
  "pagination": { ... },
  "summary": {
    "total_commissions_received": 150.00,
    "commissions_count": 1,
    "balance": 10000.00,
    "balance_withdrawn": 5150.00
  }
}
```

---

## 🔐 Segurança

### Transações Atômicas
- ✅ Compra usa `DB::transaction()`
- ✅ Comissões usam `DB::transaction()` separada
- ✅ Rollback automático em caso de erro

### Isolamento
- ✅ Erro em comissões **NÃO** cancela a compra
- ✅ Logs detalhados de falhas
- ✅ Sistema continua funcionando

### Validações
- ✅ FK constraints no banco
- ✅ Validação de saldo antes de criar cycle
- ✅ Validação de uplines existentes

---

## 📊 Logs e Monitoramento

### Sucesso
```
[INFO] Comissão processada
{
  "upline_id": 2,
  "buyer_id": 3,
  "level": 1,
  "amount": 150.00,
  "type": "FIRST_PURCHASE"
}

[INFO] Comissões processadas com sucesso
{
  "cycle_id": 15,
  "commissions_count": 3,
  "total_distributed": 180.00
}
```

### Erro
```
[ERROR] Erro ao processar comissões
{
  "cycle_id": 15,
  "error": "Upline not found",
  "trace": "..."
}
```

---

## 🧪 Casos de Teste

### Teste 1: Primeira Compra (3 níveis)
```
Admin → João → Maria → Pedro (COMPRA R$ 1000)

Resultado:
- Maria: +R$ 150 (15%)
- João: +R$ 20 (2%)
- Admin: +R$ 10 (1%)
Total: R$ 180 (18%)
```

### Teste 2: Segunda Compra
```
Pedro COMPRA novamente R$ 500

Resultado:
- Maria: +R$ 40 (8%)
- João: +R$ 10 (2%)
- Admin: +R$ 5 (1%)
Total: R$ 55 (11%)
```

### Teste 3: Sem Uplines
```
Admin (sem referred_by) COMPRA R$ 1000

Resultado:
- Nenhuma comissão distribuída
- Sistema não falha
- Log: "Nenhum upline na cadeia"
```

### Teste 4: Apenas 1 Nível
```
Admin → João (COMPRA R$ 1000)

Resultado:
- Admin: +R$ 150 (15%)
- Loop para no nível 1
- Níveis 2 e 3 não processados (não existem)
```

---

## 📈 Performance

### Otimizações
- ✅ Índices em todas as FKs
- ✅ Índice composto: `(user_id, created_at)`
- ✅ Eager loading: `with(['fromUser', 'cycle.plan'])`
- ✅ Paginação automática (20 por página)

### Queries Executadas por Compra
```
1. SELECT user (comprador)
2. SELECT plan
3. SELECT COUNT cycles (verificar limite)
4. SELECT COUNT cycles (primeira compra?)
5. INSERT cycle
6. UPDATE user (balance, total_invested)
7-9. SELECT upline (3x, até 3 níveis)
10-12. INSERT commission (3x)
13-15. UPDATE upline balance_withdrawn (3x)
```

**Total: ~15 queries** (otimizado com eager loading)

---

## ✅ Checklist de Implementação

- [x] Migration `create_commissions_table`
- [x] Model `Commission` com relacionamentos
- [x] Action `ProcessReferralCommissions`
- [x] Integração no `InvestmentController`
- [x] Endpoint `GET /api/v1/profile/statement`
- [x] Logs de sucesso e erro
- [x] Transações atômicas
- [x] Descrições detalhadas
- [x] Testes manuais
- [x] Documentação completa

---

## 🎉 Status: COMPLETO E FUNCIONAL

Sistema de comissões MLM totalmente implementado e testado! ✅











