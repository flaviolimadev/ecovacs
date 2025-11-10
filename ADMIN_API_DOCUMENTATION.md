# 🔐 API de Administração - Documentação Completa

## ✅ Status: TOTALMENTE FUNCIONAL

Painel administrativo completo para gerenciar usuários do sistema Ecovacs.

---

## 🛡️ Autenticação

**Todas as rotas administrativas requerem:**
1. ✅ Autenticação via Sanctum (`Authorization: Bearer {token}`)
2. ✅ Role de admin (`role = 'admin'`)

**Se não for admin:**
```json
{
    "error": {
        "code": "FORBIDDEN",
        "message": "Acesso negado. Apenas administradores podem acessar este recurso."
    }
}
```

---

## 👤 Usuário Admin Padrão

**Credenciais:**
```
Email: admin@ecovacs.com
Senha: admin123
```

⚠️ **IMPORTANTE: Altere a senha em produção!**

---

## 📊 Endpoints Disponíveis

### **Base URL:** `/api/v1/admin/users`

---

## 1️⃣ Estatísticas Gerais

### `GET /api/v1/admin/users/stats`

Obter estatísticas gerais do sistema.

**Response:**
```json
{
    "data": {
        "users": {
            "total": 1523,
            "admins": 3,
            "regular": 1520,
            "today": 12,
            "this_week": 87,
            "this_month": 342
        },
        "balances": {
            "total_balance": 125430.50,
            "total_balance_withdrawn": 43210.25,
            "total_invested": 98765.00,
            "total_earned": 54321.75,
            "total_withdrawn": 23456.90
        }
    }
}
```

---

## 2️⃣ Listar Usuários

### `GET /api/v1/admin/users`

Listar todos os usuários com paginação e filtros.

**Query Parameters:**
- `per_page` (int, default: 20) - Itens por página
- `search` (string) - Buscar por nome, email, CPF ou código de indicação
- `role` (string) - Filtrar por role: `user` ou `admin`
- `sort_by` (string, default: `created_at`) - Ordenar por: `name`, `email`, `created_at`, `balance`, etc.
- `sort_order` (string, default: `desc`) - Ordem: `asc` ou `desc`

**Exemplo:**
```
GET /api/v1/admin/users?search=joão&role=user&per_page=50&sort_by=balance&sort_order=desc
```

**Response:**
```json
{
    "data": [
        {
            "id": 42,
            "name": "João Silva",
            "email": "joao@email.com",
            "cpf": "12345678900",
            "phone": "(84) 99999-9999",
            "role": "user",
            "balance": 1500.00,
            "balance_withdrawn": 350.50,
            "total_invested": 2000.00,
            "total_earned": 850.50,
            "total_withdrawn": 500.00,
            "referral_code": "JOAO-ABC123",
            "referred_by_id": 10,
            "referred_by": {
                "id": 10,
                "name": "Maria Santos",
                "email": "maria@email.com"
            },
            "direct_referrals_count": 5,
            "created_at": "2025-01-15T14:30:00Z",
            "updated_at": "2025-11-10T10:00:00Z"
        }
    ],
    "meta": {
        "current_page": 1,
        "last_page": 77,
        "per_page": 20,
        "total": 1523
    }
}
```

---

## 3️⃣ Visualizar Usuário

### `GET /api/v1/admin/users/{id}`

Obter detalhes completos de um usuário específico.

**Response:**
```json
{
    "data": {
        "id": 42,
        "name": "João Silva",
        "email": "joao@email.com",
        "cpf": "12345678900",
        "phone": "(84) 99999-9999",
        "role": "user",
        "balance": 1500.00,
        "balance_withdrawn": 350.50,
        "total_invested": 2000.00,
        "total_earned": 850.50,
        "total_withdrawn": 500.00,
        "referral_code": "JOAO-ABC123",
        "referred_by_id": 10,
        "referred_by": {
            "id": 10,
            "name": "Maria Santos",
            "email": "maria@email.com",
            "referral_code": "MARIA-XYZ789"
        },
        "direct_referrals": [
            {
                "id": 50,
                "name": "Pedro Oliveira",
                "email": "pedro@email.com",
                "created_at": "2025-02-10T08:20:00Z"
            },
            {
                "id": 51,
                "name": "Ana Costa",
                "email": "ana@email.com",
                "created_at": "2025-02-12T16:45:00Z"
            }
        ],
        "created_at": "2025-01-15T14:30:00Z",
        "updated_at": "2025-11-10T10:00:00Z"
    }
}
```

---

## 4️⃣ Atualizar Usuário

### `PUT /api/v1/admin/users/{id}`

Atualizar qualquer campo do usuário, incluindo senha.

**Request Body (todos os campos são opcionais):**
```json
{
    "name": "João da Silva Santos",
    "email": "joao.novo@email.com",
    "cpf": "98765432100",
    "phone": "(84) 98888-7777",
    "role": "admin",
    "password": "nova_senha_123",
    "balance": 2000.00,
    "balance_withdrawn": 500.00,
    "total_invested": 3000.00,
    "total_earned": 1200.00,
    "total_withdrawn": 700.00,
    "referred_by_id": 20
}
```

**Validações:**
- `name` - String, máx 255 caracteres
- `email` - Email válido, único no sistema
- `cpf` - 11 dígitos, único no sistema
- `phone` - String, máx 20 caracteres
- `role` - Apenas `user` ou `admin`
- `password` - Mínimo 6 caracteres (será hasheada automaticamente)
- `balance` - Número >= 0
- `balance_withdrawn` - Número >= 0
- `total_invested` - Número >= 0
- `total_earned` - Número >= 0
- `total_withdrawn` - Número >= 0
- `referred_by_id` - ID de usuário existente

**Response (Sucesso):**
```json
{
    "data": {
        "id": 42,
        "name": "João da Silva Santos",
        "email": "joao.novo@email.com",
        "cpf": "98765432100",
        "phone": "(84) 98888-7777",
        "role": "admin",
        "balance": 2000.00,
        "balance_withdrawn": 500.00,
        "total_invested": 3000.00,
        "total_earned": 1200.00,
        "total_withdrawn": 700.00,
        "updated_at": "2025-11-10T14:35:00Z"
    },
    "message": "Usuário atualizado com sucesso"
}
```

**Response (Erro - Validação):**
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Dados inválidos",
        "details": {
            "email": ["O email já está em uso"],
            "password": ["A senha deve ter no mínimo 6 caracteres"]
        }
    }
}
```

---

## 5️⃣ Deletar Usuário

### `DELETE /api/v1/admin/users/{id}`

Deletar um usuário do sistema.

**Regras de Segurança:**
1. ❌ Não pode deletar o próprio usuário admin
2. ❌ Não pode deletar usuário com saldo (deve zerar primeiro)

**Response (Sucesso):**
```json
{
    "message": "Usuário deletado com sucesso"
}
```

**Response (Erro - Tentando deletar a si mesmo):**
```json
{
    "error": {
        "code": "CANNOT_DELETE_SELF",
        "message": "Você não pode deletar sua própria conta"
    }
}
```

**Response (Erro - Usuário tem saldo):**
```json
{
    "error": {
        "code": "USER_HAS_BALANCE",
        "message": "Não é possível deletar usuário com saldo. Zere os saldos primeiro.",
        "details": {
            "balance": 1500.00,
            "balance_withdrawn": 350.50
        }
    }
}
```

---

## 6️⃣ Ajustar Saldo Manualmente

### `POST /api/v1/admin/users/{id}/adjust-balance`

Ajustar saldo de um usuário manualmente (adicionar, subtrair ou definir).

**Request Body:**
```json
{
    "type": "balance",
    "action": "add",
    "amount": 500.00,
    "reason": "Crédito promocional Black Friday"
}
```

**Parâmetros:**
- `type` (required) - Tipo de saldo:
  - `balance` - Saldo para investir
  - `balance_withdrawn` - Saldo para saque
- `action` (required) - Ação:
  - `add` - Adicionar ao saldo atual
  - `subtract` - Subtrair do saldo atual
  - `set` - Definir valor absoluto
- `amount` (required) - Valor >= 0
- `reason` (required) - Motivo do ajuste (máx 500 caracteres)

**Exemplos:**

### Adicionar R$ 500 ao saldo investível:
```json
{
    "type": "balance",
    "action": "add",
    "amount": 500.00,
    "reason": "Bônus de cadastro"
}
```

### Subtrair R$ 100 do saldo sacável:
```json
{
    "type": "balance_withdrawn",
    "action": "subtract",
    "amount": 100.00,
    "reason": "Correção de erro manual"
}
```

### Definir saldo investível para R$ 1000:
```json
{
    "type": "balance",
    "action": "set",
    "amount": 1000.00,
    "reason": "Reset de conta para testes"
}
```

**Response (Sucesso):**
```json
{
    "data": {
        "user_id": 42,
        "type": "balance",
        "old_value": 1500.00,
        "new_value": 2000.00,
        "difference": 500.00
    },
    "message": "Saldo ajustado com sucesso"
}
```

**Observação:** O ajuste é registrado automaticamente no `ledger` (extrato) do usuário.

---

## 🔒 Segurança Implementada

### ✅ Proteções:
1. **Middleware Admin** - Somente usuários com `role = 'admin'` podem acessar
2. **Autenticação Obrigatória** - Token Sanctum válido
3. **Validações Rigorosas** - Todos os campos são validados
4. **Auditoria** - Ajustes manuais são registrados no ledger
5. **Proteções de Deleção**:
   - Não pode deletar a si mesmo
   - Não pode deletar usuário com saldo

---

## 📊 Casos de Uso

### **1. Buscar usuários por email:**
```
GET /api/v1/admin/users?search=joao@email.com
```

### **2. Listar apenas admins:**
```
GET /api/v1/admin/users?role=admin
```

### **3. Ver top 10 usuários com maior saldo:**
```
GET /api/v1/admin/users?sort_by=balance&sort_order=desc&per_page=10
```

### **4. Promover usuário para admin:**
```json
PUT /api/v1/admin/users/42
{
    "role": "admin"
}
```

### **5. Resetar senha de usuário:**
```json
PUT /api/v1/admin/users/42
{
    "password": "nova_senha_temporaria"
}
```

### **6. Corrigir saldo manualmente:**
```json
POST /api/v1/admin/users/42/adjust-balance
{
    "type": "balance_withdrawn",
    "action": "add",
    "amount": 150.00,
    "reason": "Correção de erro no sistema de comissões"
}
```

### **7. Zerar saldos antes de deletar:**
```json
PUT /api/v1/admin/users/42
{
    "balance": 0,
    "balance_withdrawn": 0
}
```

```
DELETE /api/v1/admin/users/42
```

---

## 🎯 Resumo de Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/admin/users/stats` | Estatísticas gerais |
| `GET` | `/admin/users` | Listar usuários (paginado) |
| `GET` | `/admin/users/{id}` | Visualizar usuário |
| `PUT` | `/admin/users/{id}` | Atualizar usuário |
| `DELETE` | `/admin/users/{id}` | Deletar usuário |
| `POST` | `/admin/users/{id}/adjust-balance` | Ajustar saldo |

---

## ✅ Checklist de Funcionalidades

- [x] Listar todos os usuários
- [x] Buscar por nome, email, CPF
- [x] Filtrar por role
- [x] Ordenação customizada
- [x] Paginação
- [x] Ver detalhes completos
- [x] Editar qualquer campo
- [x] Alterar senha
- [x] Promover/rebaixar admin
- [x] Ajustar saldos manualmente
- [x] Deletar usuários (com proteções)
- [x] Estatísticas do sistema
- [x] Auditoria de ajustes

---

## 🎉 Conclusão

**Sistema administrativo completo e seguro para gerenciamento total de usuários!**

- ✅ Controle total sobre todos os dados
- ✅ Proteções de segurança
- ✅ Auditoria completa
- ✅ API REST padronizada
- ✅ Pronto para produção

**ACESSO ADMIN:**
```
Email: admin@ecovacs.com
Senha: admin123
```

