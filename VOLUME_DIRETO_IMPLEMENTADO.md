# ✅ Volume Direto da Rede - Implementado

## 🎯 O Que É Volume Direto?

**Volume Direto** = Soma total (em R$) de **todos os investimentos** dos usuários **indicados diretamente** (nível 1 / nível A).

## 💡 Como Funciona

### 1. **Quando um Usuário Compra um Plano**

```php
// InvestmentController@store (linha 102)
$user->total_invested = (float) $user->total_invested + $price;
$user->save();
```

O campo `total_invested` do usuário é **incrementado** com o valor da compra.

**Exemplo:**
- Usuário João compra plano de R$ 50
- `total_invested` do João vai de `0` para `50`
- João compra outro plano de R$ 150
- `total_invested` do João vai de `50` para `200`

### 2. **Cálculo do Volume Direto no Backend**

```php
// NetworkController@stats (linha 26-38)
for ($level = 1; $level <= 3; $level++) {
    $referrals = Referral::where('user_id', $user->id)
        ->where('level', $level)
        ->with(['referredUser.cycles'])
        ->get();

    $totalDeposits = 0;

    foreach ($referrals as $referral) {
        $referredUser = $referral->referredUser;
        $totalDeposits += $referredUser->total_invested ?? 0; // ← Soma aqui!
    }

    $levelStats[] = [
        'level' => $level,
        'level_name' => chr(64 + $level), // A, B, C
        'members' => $totalMembers,
        'total_deposits' => (float) $totalDeposits, // ← Retorna aqui!
    ];
}
```

**Como funciona:**
1. Busca todos os usuários do nível especificado
2. Para cada usuário, soma o campo `total_invested`
3. Retorna no `total_deposits` de cada nível

**Exemplo:**
- Admin indicou João (nível A) → João investiu R$ 200
- Admin indicou Maria (nível A) → Maria investiu R$ 300
- Admin indicou Pedro (nível A) → Pedro investiu R$ 150
- **Volume Direto (Nível A)** = R$ 200 + R$ 300 + R$ 150 = **R$ 650**

### 3. **Exibição no Frontend**

```typescript
// Members.tsx (linha 48)
// Volume direto da rede (nível A)
setDirectNetworkVolume(formattedStats[0]?.totalDeposits || 0);
```

O frontend pega o `totalDeposits` do **primeiro nível** (índice 0 = nível A) e usa como "Volume Direto".

## 📊 Estrutura de Dados

### Resposta da API `/api/v1/network/stats`

```json
{
  "data": {
    "levels": [
      {
        "level": 1,
        "level_name": "A",
        "members": 5,
        "active_members": 3,
        "inactive_members": 2,
        "total_deposits": 1250.50  // ← Volume Direto (Nível A)
      },
      {
        "level": 2,
        "level_name": "B",
        "members": 15,
        "active_members": 10,
        "inactive_members": 5,
        "total_deposits": 3500.00
      },
      {
        "level": 3,
        "level_name": "C",
        "members": 30,
        "active_members": 20,
        "inactive_members": 10,
        "total_deposits": 8750.00
      }
    ],
    "total_members": 50,
    "active_members": 33,
    "inactive_members": 17,
    "direct_members": 5,
    "referral_code": "ADMIN001",
    "referral_link": "https://clickads.pro/register?ref=ADMIN001"
  }
}
```

**Volume Direto** = `levels[0].total_deposits` = R$ 1.250,50

## 🧪 Como Testar

### 1. Criar Usuários de Teste

```bash
# No tinker (php artisan tinker)
$admin = User::where('email', 'admin@admin.com')->first();

# Criar usuário nível 1 (indicado direto)
$user1 = User::create([
    'name' => 'João Silva',
    'email' => 'joao@teste.com',
    'phone' => '11999999991',
    'password' => bcrypt('123456'),
    'referral_code' => 'JOAO001',
    'referred_by' => $admin->id,
    'balance' => 1000,
]);

# Criar referral nível 1
Referral::create([
    'user_id' => $admin->id,
    'referred_user_id' => $user1->id,
    'level' => 1
]);
```

### 2. Fazer Compras

```bash
# João compra plano de R$ 50
$plan = Plan::first();
$cycle = Cycle::create([
    'user_id' => $user1->id,
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
]);

# Atualizar total_invested do João
$user1->total_invested += 50.00;
$user1->balance -= 50.00;
$user1->save();
```

### 3. Verificar Volume Direto

```bash
# Chamar a API
GET /api/v1/network/stats
Authorization: Bearer {admin_token}
```

**Resultado esperado:**
```json
{
  "data": {
    "levels": [
      {
        "level": 1,
        "level_name": "A",
        "members": 1,
        "total_deposits": 50.00  // ← João investiu R$ 50
      }
    ]
  }
}
```

### 4. Verificar no Frontend

1. Fazer login como admin
2. Ir para `/members`
3. Ver na seção **GoalsSection** o "Volume Direto da Rede"

## 📈 Exemplo Real

### Cenário:

```
Admin (você)
├── João (Nível A) → investiu R$ 200 (50 + 150)
├── Maria (Nível A) → investiu R$ 500 (300 + 200)
├── Pedro (Nível A) → investiu R$ 150 (150)
│
├── João indicou:
│   ├── Carlos (Nível B para Admin) → investiu R$ 100
│   └── Ana (Nível B para Admin) → investiu R$ 250
│
└── Maria indicou:
    └── Lucas (Nível B para Admin) → investiu R$ 300
```

**Cálculos:**

| Nível | Nome | Total Investido |
|-------|------|-----------------|
| A | João | R$ 200 |
| A | Maria | R$ 500 |
| A | Pedro | R$ 150 |
| **Nível A Total** | | **R$ 850** ← Volume Direto |

| Nível | Nome | Total Investido |
|-------|------|-----------------|
| B | Carlos | R$ 100 |
| B | Ana | R$ 250 |
| B | Lucas | R$ 300 |
| **Nível B Total** | | **R$ 650** |

**No Frontend:**
- **Volume Direto da Rede**: R$ 850,00 (apenas nível A)
- **Volume Total da Rede**: R$ 1.500,00 (todos os níveis)

## 🔍 Verificar Dados no Banco

### Ver total_invested de um usuário

```sql
SELECT id, name, total_invested, balance
FROM users
WHERE referred_by = 1; -- 1 = ID do admin
```

### Ver volume direto calculado manualmente

```sql
SELECT 
    SUM(u.total_invested) as volume_direto
FROM users u
JOIN referrals r ON r.referred_user_id = u.id
WHERE r.user_id = 1  -- 1 = ID do admin
  AND r.level = 1;   -- Apenas nível 1 (direto)
```

### Ver todos os níveis

```sql
SELECT 
    r.level,
    COUNT(DISTINCT u.id) as membros,
    SUM(u.total_invested) as volume_total
FROM users u
JOIN referrals r ON r.referred_user_id = u.id
WHERE r.user_id = 1  -- 1 = ID do admin
GROUP BY r.level
ORDER BY r.level;
```

**Resultado esperado:**
```
level | membros | volume_total
------|---------|-------------
  1   |    3    |   850.00
  2   |    3    |   650.00
  3   |    0    |     0.00
```

## ✅ Resumo

| Item | Status | Localização |
|------|--------|-------------|
| **Campo total_invested** | ✅ Atualizado | `InvestmentController@store` linha 102 |
| **Cálculo do Volume** | ✅ Implementado | `NetworkController@stats` linha 38 |
| **Retorno na API** | ✅ Funcionando | `total_deposits` por nível |
| **Exibição Frontend** | ✅ Implementado | `Members.tsx` linha 48 |
| **GoalsSection** | ✅ Recebe o valor | `currentVolume` prop |

## 🎯 Tudo Está Funcionando!

O sistema **JÁ calcula** o volume direto corretamente:

1. ✅ Quando um usuário compra, `total_invested` é atualizado
2. ✅ A API soma o `total_invested` dos usuários do nível 1
3. ✅ O frontend exibe esse valor na seção de metas

**Não precisa fazer nenhuma alteração!** O código está correto! 🎉

---

**Data:** 2025-11-07
**Status:** ✅ **IMPLEMENTADO E FUNCIONANDO**
**Arquivo:** NetworkController.php (linha 38), InvestmentController.php (linha 102)

