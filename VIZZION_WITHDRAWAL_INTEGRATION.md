# 🏦 Integração Vizzion Pay - Saques (Transferências PIX)

## 📋 Visão Geral

Este documento descreve a implementação da integração com a API Vizzion Pay para processar **saques automáticos via PIX** na plataforma Ecovacs.

## 🔧 Fluxo de Funcionamento

### 1️⃣ Solicitação de Saque pelo Usuário

**Endpoint:** `POST /api/v1/withdrawals`

**Payload:**
```json
{
  "amount": 100.00,
  "cpf": "12345678901",
  "pix_key": "meuemail@exemplo.com",
  "pix_key_type": "email"
}
```

**Validações:**
- ✅ Janela de horário (seg-sex, 10:00-17:00)
- ✅ Valor mínimo (R$ 50,00)
- ✅ Limite diário (1 saque/dia)
- ✅ Saldo disponível (`balance_withdrawn`)
- ✅ Taxa de saque (10%)

### 2️⃣ Criação do Registro no Banco

Após validações, o sistema:
1. **Debita** o valor total do `balance_withdrawn` do usuário
2. **Cria** o registro na tabela `withdrawals` com status `REQUESTED`
3. **Registra** no `ledger` (extrato) a operação de débito

### 3️⃣ Processamento Automático via Vizzion

O método `processWithdrawal()` é chamado automaticamente e:

1. **Formata os dados** no padrão da documentação Vizzion:

```php
[
    'identifier' => 'withdraw_123_1699999999',
    'clientIdentifier' => 'withdraw_123_1699999999',
    'callbackUrl' => 'https://seudominio.com/api/v1/webhooks/vizzion',
    'amount' => 90.00, // Valor líquido (já com taxa descontada)
    'discountFeeOfReceiver' => false, // Cliente não paga taxa extra
    'pix' => [
        'type' => 'email',
        'key' => 'meuemail@exemplo.com',
    ],
    'owner' => [
        'ip' => '123.45.67.89',
        'name' => 'João Silva',
        'document' => [
            'type' => 'cpf',
            'number' => '123.456.789-01', // CPF formatado
        ],
    ],
]
```

2. **Envia** para a API Vizzion:
   - **URL:** `https://app.vizzionpay.com/api/v1/gateway/transfers`
   - **Headers:**
     - `x-public-key: sua_api_key`
     - `x-secret-key: sua_api_secret`
     - `Content-Type: application/json`

3. **Atualiza** o status do saque com base na resposta:

   - ✅ **Sucesso:** `status = APPROVED`, salva `transaction_id` e `raw_response`
   - ❌ **Falha:** mantém `status = REQUESTED`, salva `error_message`

### 4️⃣ Webhook de Confirmação

Quando a Vizzion processar o pagamento, ela enviará um webhook para:

**Endpoint:** `POST /api/v1/webhooks/vizzion`

**Exemplo de Payload:**
```json
{
  "event": "transfer.paid",
  "withdraw": {
    "id": "vizzion-transfer-id",
    "status": "PAID",
    "amount": 90.00,
    "feeAmount": 0.00
  },
  "webhookToken": "token-de-seguranca"
}
```

O webhook deve:
1. Marcar o saque como `PAID`
2. Atualizar `paid_at` e `processed_at`
3. (Opcional) Registrar no ledger a confirmação

## 📊 Estados do Saque

| Status | Descrição |
|--------|-----------|
| `REQUESTED` | Aguardando processamento (inicial) |
| `APPROVED` | Transferência enviada à Vizzion com sucesso |
| `PAID` | Transferência confirmada e paga |
| `REJECTED` | Saque rejeitado (manual ou por erro) |

## 🗄️ Estrutura do Banco de Dados

### Tabela `withdrawals`

```sql
CREATE TABLE withdrawals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    fee_amount DECIMAL(18,2) NOT NULL,
    net_amount DECIMAL(18,2) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    pix_key VARCHAR(255) NOT NULL,
    pix_key_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'REQUESTED',
    transaction_id VARCHAR(255) NULL,
    raw_response JSONB NULL,
    error_message TEXT NULL,
    rejection_reason TEXT NULL,
    requested_at TIMESTAMP NOT NULL,
    approved_at TIMESTAMP NULL,
    processed_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Campos Importantes

- **`amount`**: Valor solicitado pelo usuário
- **`fee_amount`**: Taxa cobrada (10%)
- **`net_amount`**: Valor líquido transferido (amount - fee_amount)
- **`raw_response`**: Resposta completa da API Vizzion (JSONB)
- **`error_message`**: Mensagem de erro, se houver
- **`transaction_id`**: ID da transação na Vizzion

## 🔐 Configuração

### Variáveis de Ambiente (.env)

```env
PAYMENT_API_URL=https://app.vizzionpay.com/api/v1
PAYMENT_API_KEY=sua_api_key_aqui
PAYMENT_API_SECRET=sua_api_secret_aqui
PAYMENT_MOCK=false
```

### Config (config/services.php)

```php
'vizzionpay' => [
    'base_url' => env('PAYMENT_API_URL'),
    'api_key' => env('PAYMENT_API_KEY'),
    'api_secret' => env('PAYMENT_API_SECRET'),
],
```

## 🧪 Testando

### 1. Teste Manual via API

```bash
curl -X POST https://seudominio.com/api/v1/withdrawals \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "cpf": "12345678901",
    "pix_key": "teste@teste.com",
    "pix_key_type": "email"
  }'
```

### 2. Verificar Logs

```bash
tail -f storage/logs/laravel.log | grep "Transferência PIX"
```

**Log de Sucesso:**
```
[2025-11-10 12:00:00] local.INFO: Transferência PIX iniciada com sucesso
{
  "withdrawal_id": 123,
  "transaction_id": "vizzion-abc-123",
  "status": "PAID"
}
```

**Log de Erro:**
```
[2025-11-10 12:00:00] local.WARNING: Falha ao iniciar transferência PIX
{
  "withdrawal_id": 123,
  "error": "Saldo insuficiente na conta Vizzion"
}
```

## 🚨 Tratamento de Erros

### Erros Comuns

1. **IP bloqueado pelo Cloudflare**
   - **Solução:** Adicionar IP do servidor na whitelist da Vizzion

2. **Credenciais inválidas (401)**
   - **Solução:** Verificar `PAYMENT_API_KEY` e `PAYMENT_API_SECRET`

3. **Saldo insuficiente na Vizzion**
   - **Solução:** Fazer recarga na conta Vizzion

4. **Chave PIX inválida**
   - **Solução:** Validar formato da chave PIX antes de enviar

### Rollback Automático

Se a transferência falhar:
- ❌ O saldo **NÃO** é devolvido automaticamente
- ⚠️ Admin deve **aprovar ou rejeitar** manualmente
- ✅ Se rejeitado, o sistema **estorna** o valor para `balance_withdrawn`

## 🔄 Painel Admin

### Ações Disponíveis

1. **Aprovar** (`/api/v1/admin/withdrawals/{id}/approve`)
   - Tenta reprocessar a transferência via Vizzion

2. **Marcar como Pago** (`/api/v1/admin/withdrawals/{id}/mark-as-paid`)
   - Confirma pagamento manualmente (se pago fora do sistema)

3. **Rejeitar** (`/api/v1/admin/withdrawals/{id}/reject`)
   - Cancela o saque e **estorna** o valor para o usuário

## 📞 Suporte Vizzion

- **Email:** suporte@vizzion.com.br
- **Painel:** https://painel.vizzion.com.br
- **Documentação:** https://docs.vizzion.com.br

## 🔗 Referências

- [Código Python de Teste](../tests/vizzion_transfer_test.py)
- [VizzionPayService.php](../app/Services/VizzionPayService.php)
- [WithdrawController.php](../app/Http/Controllers/API/V1/WithdrawController.php)
- [Withdrawal Model](../app/Models/Withdrawal.php)

---

**✅ Implementado em:** 10/11/2025  
**📝 Última atualização:** 10/11/2025

