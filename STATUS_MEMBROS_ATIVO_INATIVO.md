# 🟢🔴 Status de Membros: Ativo / Inativo - Página Members

## ✅ Implementação Completa

Sistema de status ativo/inativo para membros indicados implementado com sucesso na página `/members`!

---

## 🎯 Regra de Negócio

### Status de Membros Indicados

| Status | Condição | Badge | Cor |
|--------|----------|-------|-----|
| **ATIVO** ✅ | Membro tem pelo menos 1 investimento (qualquer status) | "Ativo" com CheckCircle | Verde |
| **INATIVO** ❌ | Membro nunca fez nenhuma compra | "Inativo" com XCircle | Vermelho |

**Aplicado em:**
- Lista de membros individuais
- Estatísticas por nível (cards A, B, C)
- Totais gerais da rede

---

## 🔄 Fluxo de Status

```
┌─────────────────────────────────────┐
│   MEMBRO CADASTRADO VIA INDICAÇÃO   │
│   Status: INATIVO 🔴                │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   MEMBRO FAZ PRIMEIRA COMPRA        │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   Status: ATIVO ✅                  │
│   (Permanece ativo para sempre)     │
└─────────────────────────────────────┘
```

---

## 💾 Backend (API)

### Endpoint 1: `GET /api/v1/network/stats`

Retorna estatísticas da rede com contagem de membros ativos/inativos por nível.

**Request:**
```http
GET /api/v1/network/stats
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": {
    "levels": [
      {
        "level": 1,
        "level_name": "A",
        "members": 15,
        "active_members": 10,
        "inactive_members": 5,
        "total_deposits": 45000.00
      },
      {
        "level": 2,
        "level_name": "B",
        "members": 8,
        "active_members": 5,
        "inactive_members": 3,
        "total_deposits": 12000.00
      },
      {
        "level": 3,
        "level_name": "C",
        "members": 3,
        "active_members": 2,
        "inactive_members": 1,
        "total_deposits": 3000.00
      }
    ],
    "total_members": 26,
    "active_members": 17,
    "inactive_members": 9,
    "direct_members": 15,
    "referral_code": "ADMIN001",
    "referral_link": "http://localhost:8000/register?ref=ADMIN001"
  }
}
```

---

### Endpoint 2: `GET /api/v1/network/tree`

Retorna lista de membros com status individual.

**Request:**
```http
GET /api/v1/network/tree?level=1
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": [
    {
      "id": 2,
      "name": "João Silva",
      "email": "joao@test.com",
      "level": 1,
      "level_name": "A",
      "total_invested": 1500.00,
      "total_earned": 320.00,
      "referral_code": "JOAO123",
      "created_at": "2025-11-07T10:30:00Z",
      "is_active": true,
      "user_status": "active",
      "active_cycles": 2
    },
    {
      "id": 3,
      "name": "Maria Souza",
      "email": "maria@test.com",
      "level": 1,
      "level_name": "A",
      "total_invested": 0.00,
      "total_earned": 0.00,
      "referral_code": "MARIA456",
      "created_at": "2025-11-07T11:00:00Z",
      "is_active": false,
      "user_status": "inactive",
      "active_cycles": 0
    }
  ]
}
```

---

## 🏗️ Código Backend

### NetworkController - Método `stats()`

```php
public function stats(Request $request)
{
    $user = $request->user();
    $levelStats = [];
    $totalActiveMembers = 0;
    $totalInactiveMembers = 0;
    
    for ($level = 1; $level <= 3; $level++) {
        $referrals = Referral::where('user_id', $user->id)
            ->where('level', $level)
            ->with(['referredUser.cycles'])
            ->get();

        $activeMembers = 0;
        $inactiveMembers = 0;

        foreach ($referrals as $referral) {
            $referredUser = $referral->referredUser;
            
            // Verificar se tem investimentos
            $hasInvestments = $referredUser->cycles()->exists();
            
            if ($hasInvestments) {
                $activeMembers++;
                $totalActiveMembers++;
            } else {
                $inactiveMembers++;
                $totalInactiveMembers++;
            }
        }

        $levelStats[] = [
            'level' => $level,
            'level_name' => chr(64 + $level),
            'members' => $referrals->count(),
            'active_members' => $activeMembers,
            'inactive_members' => $inactiveMembers,
            'total_deposits' => ...,
        ];
    }

    return response()->json([
        'data' => [
            'levels' => $levelStats,
            'total_members' => ...,
            'active_members' => $totalActiveMembers,
            'inactive_members' => $totalInactiveMembers,
            ...
        ],
    ]);
}
```

### NetworkController - Método `tree()`

```php
public function tree(Request $request)
{
    $query = Referral::where('user_id', $request->user()->id)
        ->with(['referredUser.cycles']);
    
    $referrals = $query->get();

    $members = $referrals->map(function ($referral) {
        $referredUser = $referral->referredUser;
        
        // Verificar se usuário está ativo
        $hasInvestments = $referredUser->cycles()->exists();
        $userStatus = $hasInvestments ? 'active' : 'inactive';
        $activeCycles = $referredUser->cycles()
            ->where('status', 'ACTIVE')
            ->count();
        
        return [
            'id' => $referredUser->id,
            'name' => $referredUser->name,
            'email' => $referredUser->email,
            'is_active' => $hasInvestments,
            'user_status' => $userStatus,
            'active_cycles' => $activeCycles,
            ...
        ];
    });

    return response()->json(['data' => $members]);
}
```

---

## 🎨 Frontend (React)

### Página: `/members`

### 1. Cards de Nível (TeamLevelCard)

**Exibe:**
- Total de membros no nível
- Membros ativos (✓ ícone verde)
- Membros inativos (✗ ícone vermelho)
- Total de depósitos

```
┌─────────────────────────┐
│         15              │  ← Total
│   Número de Membros A   │
│                         │
│    ✓ 10    ✗ 5        │  ← Ativos/Inativos
│                         │
│    R$ 45.000,00         │
│    Total Depósitos      │
│                         │
│   [  A nível  ]         │
└─────────────────────────┘
```

**Código:**
```tsx
<TeamLevelCard 
  level="A"
  members={15}
  activeMembers={10}
  inactiveMembers={5}
  totalDeposits={45000}
  color="yellow"
/>
```

---

### 2. Lista de Membros (MembersList)

Cada membro exibe:
- Nome
- Badge de Nível (A, B, C)
- **Badge de Status (Ativo/Inativo)** ✅ NOVO!
- Total investido
- Ganhos totais
- Email e data de cadastro

**Membro ATIVO:**
```
┌──────────────────────────────────────────────┐
│  João Silva  [Nível A]  [✓ Ativo]          │
│                                              │
│  Total Investido        Ganhos Totais       │
│  R$ 1.500,00           R$ 320,00            │
│                                              │
│  📧 joao@test.com  📅 07/11/2025           │
└──────────────────────────────────────────────┘
```

**Membro INATIVO:**
```
┌──────────────────────────────────────────────┐
│  Maria Souza  [Nível A]  [✗ Inativo]       │
│                                              │
│  Total Investido        Ganhos Totais       │
│  R$ 0,00               R$ 0,00              │
│                                              │
│  📧 maria@test.com  📅 07/11/2025          │
└──────────────────────────────────────────────┘
```

**Código:**
```tsx
<span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${
  member.is_active 
    ? 'bg-green-100 text-green-700 border-green-300' 
    : 'bg-red-100 text-red-700 border-red-300'
}`}>
  {member.is_active ? (
    <>
      <CheckCircle2 className="w-3 h-3" />
      Ativo
    </>
  ) : (
    <>
      <XCircle className="w-3 h-3" />
      Inativo
    </>
  )}
</span>
```

---

## 📊 Estatísticas Visuais

### Cards de Nível (Antes vs Depois)

**ANTES:**
```
┌─────────────────────────┐
│         15              │
│   Número de Membros A   │
│    R$ 45.000,00         │
│    Total Depósitos      │
│   [  A nível  ]         │
└─────────────────────────┘
```

**DEPOIS:**
```
┌─────────────────────────┐
│         15              │
│   Número de Membros A   │
│    ✓ 10    ✗ 5        │  ← NOVO!
│    R$ 45.000,00         │
│    Total Depósitos      │
│   [  A nível  ]         │
└─────────────────────────┘
```

---

## 📁 Arquivos Modificados

### Backend
1. ✅ `app/Http/Controllers/API/V1/NetworkController.php`
   - Método `stats()`: Adicionado contagem de ativos/inativos
   - Método `tree()`: Adicionado verificação de status individual

### Frontend
1. ✅ `resources/js/pages/Members.tsx`
   - Passa `activeMembers` e `inactiveMembers` para os cards

2. ✅ `resources/js/components/TeamLevelCard.tsx`
   - Exibe ícones de ativos/inativos
   - Props opcionais: `activeMembers`, `inactiveMembers`

3. ✅ `resources/js/components/MembersList.tsx`
   - Badge sempre visível (ativo ou inativo)
   - Ícones CheckCircle2 / XCircle
   - Cores verde/vermelho

---

## 🔍 Queries SQL Úteis

### Contar Membros Ativos/Inativos por Nível

```sql
SELECT 
    r.level as nivel,
    COUNT(u.id) as total_membros,
    COUNT(CASE WHEN EXISTS(
        SELECT 1 FROM cycles WHERE user_id = u.id
    ) THEN 1 END) as ativos,
    COUNT(CASE WHEN NOT EXISTS(
        SELECT 1 FROM cycles WHERE user_id = u.id
    ) THEN 1 END) as inativos
FROM referrals r
JOIN users u ON u.id = r.referred_user_id
WHERE r.user_id = <ID_DO_USUARIO>
GROUP BY r.level
ORDER BY r.level;
```

**Resultado:**
```
nivel | total_membros | ativos | inativos
------|---------------|--------|----------
1     | 15            | 10     | 5
2     | 8             | 5      | 3
3     | 3             | 2      | 1
```

---

### Listar Todos os Membros com Status

```sql
SELECT 
    u.id,
    u.name,
    u.email,
    r.level,
    CASE 
        WHEN EXISTS(SELECT 1 FROM cycles WHERE user_id = u.id)
        THEN 'ATIVO ✅'
        ELSE 'INATIVO 🔴'
    END as status,
    COUNT(c.id) as total_investimentos,
    SUM(c.amount) as total_investido
FROM users u
JOIN referrals r ON r.referred_user_id = u.id
LEFT JOIN cycles c ON c.user_id = u.id
WHERE r.user_id = <ID_DO_USUARIO>
GROUP BY u.id, u.name, u.email, r.level
ORDER BY r.level, u.name;
```

---

## 🧪 Como Testar

### Cenário 1: Visualizar Rede com Membros Ativos e Inativos

**Preparação:**
1. Usuário ADMIN com código `ADMIN001`
2. Criar 3 usuários usando `ref=ADMIN001`:
   - João (faz compra de R$ 500)
   - Maria (não faz compra)
   - Pedro (faz compra de R$ 300)

**Teste:**
1. Login como ADMIN
2. Acessar `/members`
3. **Card Nível A deve mostrar:**
   - Total: 3
   - ✓ 2 (João e Pedro)
   - ✗ 1 (Maria)

4. **Lista de membros:**
   - João: Badge verde "Ativo"
   - Maria: Badge vermelho "Inativo"
   - Pedro: Badge verde "Ativo"

---

### Cenário 2: Membro Inativo Faz Primeira Compra

**Estado Inicial:**
- Maria: Inativo (badge vermelho)

**Ação:**
1. Login como Maria
2. Adicionar saldo: `UPDATE users SET balance = 1000 WHERE email = 'maria@test.com'`
3. Comprar plano de R$ 50

**Resultado Esperado:**
1. Login como ADMIN
2. Acessar `/members`
3. Maria agora aparece com badge verde "Ativo"
4. Card Nível A atualizado:
   - ✓ 3 (todos ativos)
   - ✗ 0 (nenhum inativo)

---

### Cenário 3: Estatísticas Gerais

**Verificar API:**
```http
GET /api/v1/network/stats
Authorization: Bearer {token_admin}
```

**Response esperado:**
```json
{
  "data": {
    "total_members": 26,
    "active_members": 17,
    "inactive_members": 9
  }
}
```

---

## 🎨 Estilos CSS

### Badge Ativo (Verde)
```css
bg-green-100
text-green-700
border border-green-300
```

### Badge Inativo (Vermelho)
```css
bg-red-100
text-red-700
border border-red-300
```

### Ícones nos Cards
```css
CheckCircle2: text-green-600, w-3 h-3
XCircle: text-red-600, w-3 h-3
```

---

## ✅ Checklist de Implementação

- [x] Backend: `stats()` retorna `active_members` e `inactive_members` por nível
- [x] Backend: `stats()` retorna totais gerais
- [x] Backend: `tree()` retorna `is_active` e `user_status` individual
- [x] Frontend: `TeamLevelCard` exibe ícones de ativos/inativos
- [x] Frontend: `MembersList` exibe badge sempre (ativo ou inativo)
- [x] Frontend: Ícones CheckCircle2 e XCircle
- [x] Frontend: Cores corretas (verde/vermelho)
- [x] Documentação completa
- [x] Queries SQL de exemplo

---

## 📊 Benefícios

✅ **Visibilidade**: Usuário vê claramente quais membros estão ativos
✅ **Motivação**: Incentiva a ativar membros inativos
✅ **Analytics**: Métricas claras de engajamento da rede
✅ **Transparência**: Status baseado em ação real (compra)
✅ **Performance**: Queries otimizadas com `exists()`
✅ **UX**: Ícones e cores intuitivos

---

## 🎉 Status: TOTALMENTE IMPLEMENTADO!

O sistema de status ativo/inativo para membros está 100% operacional na página `/members`! ✅

**Principais melhorias:**
- 📊 Cards de nível mostram breakdown de ativos/inativos
- 🏷️ Cada membro tem badge visual de status
- 📈 API retorna estatísticas completas
- 🎨 Interface intuitiva com cores e ícones











