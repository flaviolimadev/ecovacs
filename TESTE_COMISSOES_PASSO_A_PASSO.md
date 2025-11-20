# 🧪 Teste do Sistema de Comissões - Passo a Passo

## 🎯 Objetivo
Testar o sistema completo de comissões MLM com exemplos reais.

---

## 📋 Pré-requisitos

✅ Banco de dados criado e migrations executadas
✅ Seeder do admin executado
✅ Servidor rodando (`php artisan serve`)
✅ Frontend rodando (`npm run dev`)

---

## 👥 Estrutura de Usuários para Teste

Vamos criar uma árvore de 4 níveis:

```
┌─────────────────────────────────────┐
│  ADMIN (admin@admin.com)            │
│  Código: ADMIN001                   │
│  Balance: R$ 10.000,00              │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  JOÃO (joao@test.com)               │
│  Código: JOAO123                    │
│  Balance: R$ 5.000,00               │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  MARIA (maria@test.com)             │
│  Código: MARIA456                   │
│  Balance: R$ 2.000,00               │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  PEDRO (pedro@test.com)             │
│  Código: PEDRO789                   │
│  Balance: R$ 1.000,00               │
└─────────────────────────────────────┘
```

---

## 📝 PASSO 1: Criar Usuários

### 1.1 - Criar João (indicado por ADMIN)

**URL:** `http://localhost:8000/register?ref=ADMIN001`

```json
POST /api/v1/auth/register

{
  "name": "João Silva",
  "email": "joao@test.com",
  "phone": "(11) 91111-1111",
  "password": "123456",
  "password_confirmation": "123456",
  "referral_code": "ADMIN001"
}
```

**Resposta esperada:**
```json
{
  "message": "Usuário cadastrado com sucesso!",
  "data": {
    "user": {
      "id": 2,
      "name": "João Silva",
      "email": "joao@test.com",
      "referral_code": "JOAO123",
      "balance": 0,
      "balance_withdrawn": 0
    },
    "token": "..."
  }
}
```

✅ **João agora é NÍVEL 1 abaixo do ADMIN**

---

### 1.2 - Adicionar saldo para João

**Acesse via MySQL/PostgreSQL:**
```sql
UPDATE users 
SET balance = 5000.00 
WHERE email = 'joao@test.com';
```

---

### 1.3 - Criar Maria (indicada por JOÃO)

**URL:** `http://localhost:8000/register?ref=JOAO123`

```json
POST /api/v1/auth/register

{
  "name": "Maria Souza",
  "email": "maria@test.com",
  "phone": "(11) 92222-2222",
  "password": "123456",
  "password_confirmation": "123456",
  "referral_code": "JOAO123"
}
```

✅ **Maria agora é NÍVEL 1 abaixo de JOÃO (NÍVEL 2 abaixo do ADMIN)**

---

### 1.4 - Adicionar saldo para Maria

```sql
UPDATE users 
SET balance = 2000.00 
WHERE email = 'maria@test.com';
```

---

### 1.5 - Criar Pedro (indicado por MARIA)

**URL:** `http://localhost:8000/register?ref=MARIA456`

```json
POST /api/v1/auth/register

{
  "name": "Pedro Santos",
  "email": "pedro@test.com",
  "phone": "(11) 93333-3333",
  "password": "123456",
  "password_confirmation": "123456",
  "referral_code": "MARIA456"
}
```

✅ **Pedro agora é NÍVEL 1 abaixo de MARIA (NÍVEL 3 abaixo do ADMIN)**

---

### 1.6 - Adicionar saldo para Pedro

```sql
UPDATE users 
SET balance = 1000.00 
WHERE email = 'pedro@test.com';
```

---

## 🎯 PASSO 2: Primeira Compra (Pedro compra R$ 1.000)

### 2.1 - Login como Pedro

```json
POST /api/v1/auth/login

{
  "email": "pedro@test.com",
  "password": "123456"
}
```

**Salve o token:** `Bearer <TOKEN>`

---

### 2.2 - Listar Planos Disponíveis

```json
GET /api/v1/plans
Authorization: Bearer <TOKEN_PEDRO>
```

**Resposta:**
```json
{
  "data": {
    "standard": [
      {
        "id": 1,
        "name": "🤖 Ecovacs Deebot T8 Robot",
        "price": "50.00",
        ...
      },
      {
        "id": 4,
        "name": "🤖 Ecovacs Deebot N30 Omni",
        "price": "600.00",
        ...
      }
    ]
  }
}
```

---

### 2.3 - Comprar Plano (R$ 600 - Ecovacs N30)

```json
POST /api/v1/investments
Authorization: Bearer <TOKEN_PEDRO>

{
  "plan_id": 4
}
```

**Resposta esperada:**
```json
{
  "message": "Plano contratado com sucesso!",
  "data": {
    "cycle": {
      "id": 1,
      "plan_name": "🤖 Ecovacs Deebot N30 Omni",
      "amount": 600.00,
      "status": "ACTIVE"
    },
    "user_balance": {
      "balance": 400.00,        // 1000 - 600
      "balance_withdrawn": 0.00,
      "total_invested": 600.00
    },
    "commissions": {
      "distributed": true,
      "total_amount": 108.00,   // 18% de 600
      "count": 3
    }
  }
}
```

✅ **Comissões distribuídas automaticamente!**

---

## 💰 PASSO 3: Verificar Comissões Recebidas

### 3.1 - Login como Maria (Nível 1 - Direto)

```json
POST /api/v1/auth/login

{
  "email": "maria@test.com",
  "password": "123456"
}
```

---

### 3.2 - Ver Extrato de Maria

```json
GET /api/v1/profile/statement
Authorization: Bearer <TOKEN_MARIA>
```

**Resposta:**
```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-11-07 14:30:00",
      "type": "commission",
      "type_label": "Comissão",
      "description": "Comissão de 15% - Nível 1 (Direto) - primeira compra de Pedro Santos",
      "amount": 90.00,
      "details": {
        "level": 1,
        "percentage": 15.00,
        "from_user": "Pedro Santos",
        "purchase_amount": 600.00,
        "commission_type": "Primeira Compra"
      }
    }
  ],
  "summary": {
    "total_commissions_received": 90.00,
    "commissions_count": 1,
    "balance": 2000.00,
    "balance_withdrawn": 90.00
  }
}
```

✅ **Maria recebeu R$ 90,00 (15% de R$ 600)**
✅ **Creditado em `balance_withdrawn`**

---

### 3.3 - Ver Perfil de Maria

```json
GET /api/v1/profile
Authorization: Bearer <TOKEN_MARIA>
```

**Resposta:**
```json
{
  "data": {
    "id": 3,
    "name": "Maria Souza",
    "email": "maria@test.com",
    "balance": 2000.00,           // Saldo para investir
    "balance_withdrawn": 90.00,   // ✅ R$ 90 para sacar!
    "total_invested": 0.00,
    "total_earned": 90.00
  }
}
```

---

### 3.4 - Login como João (Nível 2 - Indireto)

```json
POST /api/v1/auth/login

{
  "email": "joao@test.com",
  "password": "123456"
}
```

---

### 3.5 - Ver Extrato de João

```json
GET /api/v1/profile/statement
Authorization: Bearer <TOKEN_JOAO>
```

**Resposta:**
```json
{
  "data": [
    {
      "id": 2,
      "date": "2025-11-07 14:30:00",
      "type": "commission",
      "description": "Comissão de 2% - Nível 2 (Indireto) - primeira compra de Pedro Santos",
      "amount": 12.00,
      "details": {
        "level": 2,
        "percentage": 2.00,
        "from_user": "Pedro Santos",
        "purchase_amount": 600.00
      }
    }
  ],
  "summary": {
    "total_commissions_received": 12.00,
    "balance_withdrawn": 12.00
  }
}
```

✅ **João recebeu R$ 12,00 (2% de R$ 600)**

---

### 3.6 - Login como ADMIN (Nível 3 - Indireto)

```json
POST /api/v1/auth/login

{
  "email": "admin@admin.com",
  "password": "admin123"
}
```

---

### 3.7 - Ver Extrato do ADMIN

```json
GET /api/v1/profile/statement
Authorization: Bearer <TOKEN_ADMIN>
```

**Resposta:**
```json
{
  "data": [
    {
      "id": 3,
      "date": "2025-11-07 14:30:00",
      "type": "commission",
      "description": "Comissão de 1% - Nível 3 (Indireto) - primeira compra de Pedro Santos",
      "amount": 6.00,
      "details": {
        "level": 3,
        "percentage": 1.00,
        "from_user": "Pedro Santos",
        "purchase_amount": 600.00
      }
    }
  ],
  "summary": {
    "total_commissions_received": 6.00,
    "balance_withdrawn": 5006.00
  }
}
```

✅ **ADMIN recebeu R$ 6,00 (1% de R$ 600)**

---

## 📊 Resumo da Primeira Compra

| Usuário | Nível | Comissão | Percentual | Saldo Saque |
|---------|-------|----------|------------|-------------|
| **Pedro** | - | - | - | R$ 400,00 (balance) |
| **Maria** | 1 | R$ 90,00 | 15% | R$ 90,00 |
| **João** | 2 | R$ 12,00 | 2% | R$ 12,00 |
| **ADMIN** | 3 | R$ 6,00 | 1% | R$ 5.006,00 |
| **TOTAL DISTRIBUÍDO** | - | **R$ 108,00** | **18%** | - |

---

## 🔄 PASSO 4: Segunda Compra (Pedro compra R$ 300)

### 4.1 - Login como Pedro novamente

```json
POST /api/v1/auth/login

{
  "email": "pedro@test.com",
  "password": "123456"
}
```

---

### 4.2 - Comprar outro plano (R$ 300)

```json
POST /api/v1/investments
Authorization: Bearer <TOKEN_PEDRO>

{
  "plan_id": 3
}
```

**Resposta:**
```json
{
  "message": "Plano contratado com sucesso!",
  "data": {
    "cycle": {
      "id": 2,
      "amount": 300.00
    },
    "user_balance": {
      "balance": 100.00,         // 400 - 300
      "total_invested": 900.00   // 600 + 300
    },
    "commissions": {
      "distributed": true,
      "total_amount": 33.00,     // 11% de 300 (8% + 2% + 1%)
      "count": 3
    }
  }
}
```

---

### 4.3 - Verificar novas comissões de Maria

```json
GET /api/v1/profile/statement
Authorization: Bearer <TOKEN_MARIA>
```

**Nova comissão:**
```json
{
  "description": "Comissão de 8% - Nível 1 (Direto) - compra de Pedro Santos",
  "amount": 24.00,
  "details": {
    "level": 1,
    "percentage": 8.00,
    "commission_type": "Compra Subsequente"
  }
}
```

**Totais atualizados:**
```json
{
  "summary": {
    "total_commissions_received": 114.00,  // 90 + 24
    "commissions_count": 2,
    "balance_withdrawn": 114.00
  }
}
```

✅ **Maria agora tem R$ 114 para sacar!**

---

## 📊 Resumo da Segunda Compra

| Usuário | Nível | Comissão | Percentual | Total Acumulado |
|---------|-------|----------|------------|-----------------|
| **Maria** | 1 | R$ 24,00 | 8% | R$ 114,00 |
| **João** | 2 | R$ 6,00 | 2% | R$ 18,00 |
| **ADMIN** | 3 | R$ 3,00 | 1% | R$ 5.009,00 |
| **TOTAL** | - | **R$ 33,00** | **11%** | **R$ 141,00** |

---

## ✅ Checklist de Validação

### Comportamentos Esperados

- [x] Primeira compra distribui 18% (15%, 2%, 1%)
- [x] Compras subsequentes distribuem 11% (8%, 2%, 1%)
- [x] Valores creditados em `balance_withdrawn`
- [x] Comissões aparecem no extrato
- [x] Descrições claras e detalhadas
- [x] Percorre até 3 níveis na árvore
- [x] Para se não houver mais uplines
- [x] Transação atômica (tudo ou nada)
- [x] Logs registrados corretamente
- [x] Compra não falha se houver erro nas comissões

---

## 🐛 Troubleshooting

### Problema: Comissões não aparecem

**Verificar:**
1. Migrations executadas? `php artisan migrate:status`
2. Tabela `commissions` existe? `SHOW TABLES;`
3. Logs do Laravel: `tail -f storage/logs/laravel.log`

### Problema: Valor não creditado

**Verificar:**
1. Consulta SQL direta:
   ```sql
   SELECT * FROM commissions 
   WHERE user_id = <ID_DO_USUARIO> 
   ORDER BY created_at DESC;
   ```

2. Verificar `balance_withdrawn`:
   ```sql
   SELECT id, name, balance, balance_withdrawn, total_earned 
   FROM users 
   WHERE email = 'maria@test.com';
   ```

### Problema: Erro 500 ao comprar

**Verificar:**
1. Saldo suficiente?
2. Plano ativo?
3. Logs: `php artisan tail`

---

## 🎉 Sistema Testado e Aprovado!

Se todos os passos acima funcionaram corretamente, o sistema de comissões está **100% operacional**! ✅











