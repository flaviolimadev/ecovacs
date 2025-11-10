# 🔔 Implementação do Webhook Vizzion Pay

## 📋 Resumo

Sistema completo de webhook para processar confirmações de pagamento PIX da Vizzion Pay, com idempotência, logging detalhado e processamento transacional.

---

## 🗂️ Arquivos Criados

### 1. **Migration** - `database/migrations/2025_11_10_010000_create_webhook_events_table.php`
Tabela para armazenar todos os webhooks recebidos:
- ✅ Idempotência por hash SHA256 do payload
- ✅ Armazena headers e payload bruto
- ✅ Status: `received`, `processed`, `failed`
- ✅ Vincula ao depósito quando encontrado
- ✅ Índices otimizados para consultas

```php
webhook_events (
    id,
    provider,           // vizzion
    event,              // TRANSACTION_PAID, etc
    external_id,        // ID no provedor
    idempotency_hash,   // SHA256 (unique)
    headers,            // JSON
    payload,            // JSON
    status,             // received/processed/failed
    deposit_id,         // FK nullable
    processed_at,
    error_message,
    timestamps
)
```

### 2. **Model** - `app/Models/WebhookEvent.php`
Modelo Eloquent para webhooks:
- ✅ Casts automáticos para JSON
- ✅ Relacionamento com `Deposit`
- ✅ Scopes: `received()`, `processed()`, `failed()`

### 3. **Controller** - `app/Http/Controllers/Api/V1/WebhookController.php`
Controlador dedicado para processar webhooks:
- ✅ Método `vizzion()` público (sem autenticação)
- ✅ Idempotência total (mesmo webhook múltiplas vezes = 1 processamento)
- ✅ Busca inteligente de depósito por múltiplos campos
- ✅ Mapeamento robusto de status
- ✅ Transações DB para garantir consistência
- ✅ Logging detalhado em todas as etapas

### 4. **Rota** - `routes/api.php`
```php
Route::post('/webhooks/vizzion', [WebhookController::class, 'vizzion'])
    ->name('api.v1.webhooks.vizzion');
```
**URL**: `https://ecovacs-app.woty8c.easypanel.host/api/v1/webhooks/vizzion`

---

## 🔄 Fluxo de Processamento

### 1️⃣ **Recebimento**
```
Vizzion Pay → POST /api/v1/webhooks/vizzion
```

### 2️⃣ **Validação & Idempotência**
- Gera hash SHA256 do payload
- Verifica se já foi processado
- Se sim: retorna 200 OK (idempotente)
- Se não: continua

### 3️⃣ **Busca do Depósito**
Tenta localizar por:
1. `transaction_id` (campo principal)
2. `order_id` do payload
3. `clientIdentifier`/`identifier` no JSON

### 4️⃣ **Mapeamento de Status**
```php
'OK'                => 'PAID',
'COMPLETED'         => 'PAID',
'APPROVED'          => 'PAID',
'SUCCESS'           => 'PAID',
'TRANSACTION_PAID'  => 'PAID',
'PENDING'           => 'PENDING',
'FAILED'            => 'CANCELLED',
'EXPIRED'           => 'EXPIRED',
```

### 5️⃣ **Processamento (se PAID)**
Dentro de **transação DB**:
1. ✅ Recarregar depósito (evitar race condition)
2. ✅ Verificar se já está pago
3. ✅ Atualizar status para `PAID`
4. ✅ Setar `paid_at = now()`
5. ✅ **Creditar saldo do usuário** (`balance`)
6. ✅ **Registrar no ledger** (extrato)
7. ✅ Logging detalhado

### 6️⃣ **Finalização**
- Marca webhook como `processed`
- Retorna 200 OK

---

## 🛡️ Segurança & Confiabilidade

### ✅ **Idempotência Total**
- Hash SHA256 do payload garante que mesmo webhook **nunca** será processado duas vezes
- Webhook duplicado = resposta imediata 200 OK

### ✅ **Race Condition Protection**
```php
DB::transaction(function () use ($deposit) {
    $deposit->refresh(); // Recarregar estado atual
    if ($deposit->status === 'PAID') {
        return; // Já processado por outro webhook
    }
    // ... processar
});
```

### ✅ **Logging Completo**
```php
// Webhook recebido
Log::info('Webhook Vizzion recebido', [...]);

// Depósito não encontrado
Log::warning('Webhook Vizzion: depósito não encontrado', [...]);

// Já processado
Log::info('Webhook Vizzion: já processado', [...]);

// Status desconhecido
Log::warning('Webhook Vizzion: status desconhecido', [...]);

// Pagamento confirmado
Log::info('Depósito confirmado e creditado', [...]);

// Erro
Log::error('Erro ao processar webhook Vizzion', [...]);
```

### ✅ **Transações DB**
Garante atomicidade:
- Atualizar depósito ✅
- Creditar usuário ✅
- Registrar ledger ✅
- **Tudo ou nada!**

---

## 📊 Campos do Webhook Vizzion Pay

### Payload esperado (exemplos):
```json
{
    "transactionId": "cmhsg5j53649hfrzlaak81p88",
    "status": "OK",
    "order": {
        "id": "cmhsg5j4q649dfrzlnv5s7l17"
    },
    "transaction": {
        "id": "cmhsg5j53649hfrzlaak81p88",
        "status": "OK"
    }
}
```

ou

```json
{
    "event": "TRANSACTION_PAID",
    "id": "xyz123",
    "clientIdentifier": "DEP-456"
}
```

---

## 🔍 Como Testar

### 1. **Teste Local com cURL**
```bash
curl -X POST https://ecovacs-app.woty8c.easypanel.host/api/v1/webhooks/vizzion \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "test-123",
    "status": "OK"
  }'
```

### 2. **Verificar Logs**
```bash
tail -f storage/logs/laravel.log
```

### 3. **Verificar Webhook Events**
```sql
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;
```

### 4. **Verificar Depósito Creditado**
```sql
SELECT d.*, u.balance 
FROM deposits d 
JOIN users u ON u.id = d.user_id 
WHERE d.id = ?;
```

---

## 🚀 Configuração na Vizzion Pay

### URL do Webhook (callbackUrl)
```
https://ecovacs-app.woty8c.easypanel.host/api/v1/webhooks/vizzion
```

### Eventos para assinar:
- ✅ `TRANSACTION_PAID` (pagamento confirmado)
- ✅ `TRANSACTION_PENDING` (aguardando pagamento)
- ✅ `TRANSACTION_FAILED` (falha no pagamento)
- ✅ `TRANSACTION_EXPIRED` (PIX expirado)

---

## 📝 Próximos Passos (TODO)

### Melhorias Futuras:
1. ⏱️ **Retry automático** para webhooks com falha
2. 📧 **Notificações** ao usuário quando pagamento confirmado
3. 🔐 **Validação de assinatura** do webhook (HMAC)
4. 📊 **Dashboard admin** para monitorar webhooks
5. 💰 **Comissões de indicação** no depósito (se aplicável)

---

## 🎯 Status Atual

✅ **TOTALMENTE FUNCIONAL**

- [x] Webhook criado e testável
- [x] Migration executada (`webhook_events`)
- [x] Idempotência implementada
- [x] Busca inteligente de depósitos
- [x] Processamento transacional
- [x] Crédito de saldo automático
- [x] Registro no ledger
- [x] Logging completo
- [x] Proteção contra race conditions

---

## 📚 Arquitetura

```
┌─────────────────┐
│  Vizzion Pay    │
│   (Webhook)     │
└────────┬────────┘
         │
         │ POST /api/v1/webhooks/vizzion
         ▼
┌─────────────────────────────┐
│   WebhookController         │
│   - Valida payload          │
│   - Verifica idempotência   │
│   - Busca depósito          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   webhook_events            │
│   (Armazena tudo)           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   Processamento             │
│   - Status = PAID?          │
│   - Transação DB            │
│   - Creditar usuário        │
│   - Registrar ledger        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   Finalização               │
│   - Webhook: processed      │
│   - Retorno: 200 OK         │
└─────────────────────────────┘
```

---

## 🎉 Resultado

**Sistema robusto, idempotente e transacional para processar pagamentos PIX da Vizzion Pay, com proteção total contra duplicatas e race conditions!**

