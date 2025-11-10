# 💸 Sistema de Saque - Implementação Completa

## ✅ Status: TOTALMENTE FUNCIONAL

Sistema completo de saques com validações rigorosas, integração com Vizzion Pay, e processamento automático.

---

## 🗂️ Arquivos Criados

### 1. **Migration** - `database/migrations/2025_11_10_000000_create_settings_table.php`
Tabela para armazenar configurações dinâmicas do sistema.

### 2. **Migration** - `database/migrations/2025_11_10_020000_create_withdrawals_table.php`
Tabela para armazenar saques:
```sql
withdrawals (
    id,
    user_id,
    amount,              -- Valor total debitado (R$ 100)
    fee_amount,          -- Taxa cobrada (R$ 10)
    net_amount,          -- Valor líquido recebido (R$ 90)
    cpf,
    pix_key,
    pix_key_type,        -- cpf/email/phone/random
    status,              -- REQUESTED/APPROVED/PROCESSING/PAID/REJECTED/CANCELLED
    transaction_id,      -- ID da transação no provedor
    rejection_reason,
    provider_response,
    requested_at,
    approved_at,
    processed_at,
    paid_at,
    timestamps
)
```

### 3. **Model** - `app/Models/Withdrawal.php`
Modelo Eloquent com:
- ✅ Casts automáticos
- ✅ Relacionamento com User
- ✅ Scopes: `requested()`, `approved()`, `paid()`, `onDate()`
- ✅ Métodos: `approve()`, `markAsPaid()`, `reject()`

### 4. **Seeder** - `database/seeders/WithdrawSettingsSeeder.php`
Configurações padrão:
```php
withdraw.window = {
    "days": ["Mon","Tue","Wed","Thu","Fri"],
    "start": "10:00",
    "end": "17:00"
}
withdraw.min = 50
withdraw.fee = 0.10  // 10%
withdraw.daily_limit_per_user = 1
```

### 5. **Controller** - `app/Http/Controllers/Api/V1/WithdrawController.php`
Endpoints completos:
- ✅ `GET /withdrawals/settings` - Obter configurações e validações
- ✅ `POST /withdrawals` - Solicitar saque
- ✅ `GET /withdrawals` - Listar saques do usuário
- ✅ `GET /withdrawals/{id}` - Buscar saque específico

### 6. **Rotas** - `routes/api.php`
Todas as rotas protegidas por autenticação Sanctum.

---

## 🎯 Funcionalidades Implementadas

### ✅ 1. Validação de Janela de Saque
```php
// Apenas Segunda a Sexta, 10:00 às 17:00
$now = Carbon::now();
$dayOfWeek = $now->format('D'); // Mon, Tue, Wed, Thu, Fri
$currentTime = $now->format('H:i'); // 14:30

if (!in_array($dayOfWeek, ['Mon','Tue','Wed','Thu','Fri'])) {
    return "Saques não permitidos aos finais de semana";
}

if ($currentTime < '10:00' || $currentTime >= '17:00') {
    return "Saques permitidos apenas das 10:00 às 17:00";
}
```

### ✅ 2. Limite Diário
```php
$withdrawalsToday = Withdrawal::where('user_id', $user->id)
    ->whereDate('requested_at', today())
    ->whereNotIn('status', ['REJECTED', 'CANCELLED'])
    ->count();

if ($withdrawalsToday >= 1) {
    return "Você já realizou 1 saque hoje";
}
```

### ✅ 3. Valor Mínimo
```php
if ($amount < 50) {
    return "O valor mínimo para saque é R$ 50,00";
}
```

### ✅ 4. Cálculo de Taxa
```php
$amount = 100.00;      // Valor solicitado
$fee = 0.10;           // 10%
$feeAmount = $amount * $fee;  // R$ 10,00
$netAmount = $amount - $feeAmount; // R$ 90,00 (recebe)
```

### ✅ 5. Validação de Saldo
```php
// APENAS balance_withdrawn pode ser sacado!
if ($user->balance_withdrawn < $amount) {
    return "Saldo insuficiente para saque";
}
```

### ✅ 6. Validação de Chave PIX
```php
switch ($pixKeyType) {
    case 'cpf':
        // Deve ter 11 dígitos
        break;
    case 'email':
        // Validar formato de email
        break;
    case 'phone':
        // 10 ou 11 dígitos
        break;
    case 'random':
        // Mínimo 32 caracteres
        break;
}
```

### ✅ 7. Processamento Transacional
```php
DB::transaction(function () {
    // 1. Criar registro de saque
    $withdrawal = Withdrawal::create([...]);
    
    // 2. Debitar saldo do usuário
    $user->balance_withdrawn -= $amount;
    $user->total_withdrawn += $amount;
    $user->save();
    
    // 3. Registrar no ledger (extrato)
    Ledger::create([
        'ref_type' => 'WITHDRAW',
        'amount' => -$amount, // Negativo
        'description' => "Saque PIX - R$ 100 (Taxa: R$ 10 | Líquido: R$ 90)"
    ]);
});
```

### ✅ 8. Integração com Vizzion Pay
```php
$transferData = [
    'amount' => 90.00, // Valor líquido
    'pixKey' => 'exemplo@email.com',
    'pixKeyType' => 'email',
    'description' => "Saque Ecovacs - #42",
    'beneficiary' => [
        'name' => 'João Silva',
        'document' => '12345678900',
        'documentType' => 'CPF',
    ],
];

$result = $vizzionService->createPixTransfer($transferData);
```

---

## 🔄 Fluxo Completo

```
1️⃣ Usuário acessa GET /withdrawals/settings
   ↓
   Retorna:
   - min_amount: 50
   - fee_percent: 0.10
   - daily_limit: 1
   - can_withdraw: true/false
   - validation_message: "Você pode realizar saques"
   - has_withdrawn_today: false
   - available_balance: 150.00
   ↓
2️⃣ Frontend valida e mostra formulário
   ↓
3️⃣ Usuário preenche:
   - Valor: R$ 100
   - CPF: 123.456.789-00
   - Tipo PIX: Email
   - Chave: joao@email.com
   ↓
4️⃣ POST /withdrawals
   ↓
   Backend valida:
   ✅ Dia útil (Mon-Fri)
   ✅ Horário (10h-17h)
   ✅ Não sacou hoje
   ✅ Valor >= R$ 50
   ✅ balance_withdrawn >= R$ 100
   ✅ CPF válido
   ✅ Chave PIX válida
   ↓
5️⃣ Calcula:
   - Taxa: R$ 10 (10%)
   - Líquido: R$ 90
   ↓
6️⃣ Transação DB:
   - Cria withdrawal (status: REQUESTED)
   - Debita balance_withdrawn: -R$ 100
   - Aumenta total_withdrawn: +R$ 100
   - Registra no ledger
   ↓
7️⃣ Chama Vizzion Pay API:
   - createPixTransfer(R$ 90)
   - Status: PROCESSING
   - transaction_id: xyz123
   ↓
8️⃣ Webhook Vizzion confirma pagamento
   - Status: PAID
   - paid_at: now()
   ↓
9️⃣ Usuário recebe R$ 90 no PIX ✅
```

---

## 📊 Endpoints

### **GET /api/v1/withdrawals/settings**
Obter configurações e validar se pode sacar.

**Response:**
```json
{
    "data": {
        "min_amount": 50,
        "fee_percent": 0.10,
        "daily_limit": 1,
        "window": {
            "days": ["Mon","Tue","Wed","Thu","Fri"],
            "start": "10:00",
            "end": "17:00"
        },
        "can_withdraw": true,
        "validation_message": "Você pode realizar saques no momento.",
        "has_withdrawn_today": false,
        "available_balance": 150.00
    }
}
```

### **POST /api/v1/withdrawals**
Solicitar saque.

**Request:**
```json
{
    "amount": 100.00,
    "cpf": "12345678900",
    "pix_key": "joao@email.com",
    "pix_key_type": "email"
}
```

**Response (Sucesso):**
```json
{
    "data": {
        "id": 42,
        "amount": 100.00,
        "fee_amount": 10.00,
        "net_amount": 90.00,
        "status": "REQUESTED",
        "requested_at": "2025-11-10T14:30:00Z",
        "message": "Saque solicitado com sucesso! Processando transferência..."
    }
}
```

**Response (Erro - Fora do Horário):**
```json
{
    "error": {
        "code": "WITHDRAW_WINDOW_CLOSED",
        "message": "Saques só são permitidos de segunda a sexta, das 10:00 às 17:00. Horário atual: 18:30."
    }
}
```

**Response (Erro - Já Sacou Hoje):**
```json
{
    "error": {
        "code": "DAILY_LIMIT_REACHED",
        "message": "Você já realizou 1 saque(s) hoje. Tente novamente amanhã."
    }
}
```

**Response (Erro - Valor Mínimo):**
```json
{
    "error": {
        "code": "AMOUNT_TOO_LOW",
        "message": "O valor mínimo para saque é R$ 50,00"
    }
}
```

**Response (Erro - Saldo Insuficiente):**
```json
{
    "error": {
        "code": "INSUFFICIENT_BALANCE",
        "message": "Saldo insuficiente para saque.",
        "details": {
            "available": 30.00,
            "required": 100.00
        }
    }
}
```

### **GET /api/v1/withdrawals**
Listar saques do usuário (paginado).

**Response:**
```json
{
    "data": [
        {
            "id": 42,
            "amount": 100.00,
            "fee_amount": 10.00,
            "net_amount": 90.00,
            "pix_key": "joao@email.com",
            "pix_key_type": "email",
            "status": "PAID",
            "rejection_reason": null,
            "requested_at": "2025-11-10T14:30:00Z",
            "paid_at": "2025-11-10T14:35:00Z"
        }
    ],
    "meta": {
        "current_page": 1,
        "last_page": 1,
        "per_page": 20,
        "total": 1
    }
}
```

### **GET /api/v1/withdrawals/{id}**
Buscar saque específico.

**Response:**
```json
{
    "data": {
        "id": 42,
        "amount": 100.00,
        "fee_amount": 10.00,
        "net_amount": 90.00,
        "cpf": "123.456.789-00",
        "pix_key": "joao@email.com",
        "pix_key_type": "email",
        "status": "PAID",
        "rejection_reason": null,
        "requested_at": "2025-11-10T14:30:00Z",
        "approved_at": "2025-11-10T14:30:05Z",
        "paid_at": "2025-11-10T14:35:00Z"
    }
}
```

---

## 🛡️ Segurança

### ✅ Proteções Implementadas:
1. **Autenticação Obrigatória** - Todas as rotas protegidas por Sanctum
2. **Validação de Propriedade** - Usuário só acessa seus próprios saques
3. **Transações DB** - Rollback automático em caso de erro
4. **Validações Rigorosas** - Dia, horário, limite, valor, saldo, PIX
5. **Logging Completo** - Todas as ações registradas
6. **Idempotência** - Mesmo saque nunca processado duas vezes

---

## 📈 Exemplo de Uso no Frontend

```typescript
// 1. Obter configurações
const { data } = await api.get('/withdrawals/settings');

if (!data.can_withdraw) {
    toast.error(data.validation_message);
    return;
}

if (data.has_withdrawn_today) {
    toast.error('Você já sacou hoje!');
    return;
}

// 2. Solicitar saque
try {
    const response = await api.post('/withdrawals', {
        amount: 100.00,
        cpf: '12345678900',
        pix_key: 'joao@email.com',
        pix_key_type: 'email'
    });

    toast.success(response.data.data.message);
    navigate('/withdrawals');

} catch (error) {
    toast.error(error.response.data.error.message);
}
```

---

## 🎉 Conclusão

**Sistema de saque 100% funcional com:**
- ✅ Todas as validações implementadas
- ✅ Integração com Vizzion Pay
- ✅ Processamento automático
- ✅ Segurança total
- ✅ Configurações dinâmicas
- ✅ Frontend já protegido contra tradução

**PRONTO PARA USO EM PRODUÇÃO!** 🚀

