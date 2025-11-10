# 🔍 Troubleshooting - Sistema de Saque

## Como Testar o Sistema

### 1. Teste Rápido (Script Automático)
```bash
cd /app
php test_withdrawal.php [user_id] [amount]

# Exemplo:
php test_withdrawal.php 1 50
```

**O script verifica:**
- ✅ Se o usuário existe
- ✅ Se tem saldo suficiente
- ✅ Se tem pelo menos 1 ciclo
- ✅ Se o CPF está cadastrado
- ✅ Configurações do sistema
- ✅ Limite diário
- ✅ Estrutura das tabelas

---

## Problemas Comuns e Soluções

### ❌ Erro: "Você precisa ter pelo menos 1 ciclo/investimento"

**Causa:** Usuário não tem nenhum ciclo cadastrado

**Solução:**
```sql
-- Verificar ciclos do usuário
SELECT * FROM cycles WHERE user_id = 1;

-- Criar ciclo de teste (se necessário)
INSERT INTO cycles (user_id, plan_id, amount, type, status, duration_days, days_paid, started_at, ends_at, created_at, updated_at)
VALUES (1, 1, 100, 'DAILY', 'ACTIVE', 30, 0, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW());
```

---

### ❌ Erro: "Saldo insuficiente"

**Causa:** `balance_withdrawn` está zerado

**Solução:**
```sql
-- Ver saldo atual
SELECT id, name, balance, balance_withdrawn FROM users WHERE id = 1;

-- Adicionar saldo para teste
UPDATE users SET balance_withdrawn = 100.00 WHERE id = 1;
```

**⚠️ IMPORTANTE:** Apenas adicionar saldo manualmente em ambiente de desenvolvimento/teste!

---

### ❌ Erro: "CPF não cadastrado"

**Causa:** Campo `cpf` do usuário está NULL

**Solução:**
```sql
-- Verificar CPF
SELECT id, name, cpf FROM users WHERE id = 1;

-- Cadastrar CPF de teste
UPDATE users SET cpf = '12345678901' WHERE id = 1;
```

---

### ❌ Erro: "Saques não são permitidos aos finais de semana"

**Causa:** Sistema configurado para permitir saques apenas em dias úteis

**Solução 1 - Desabilitar validação de janela (DEV):**
```php
// No WithdrawController.php, comentar a validação:
// $windowValidation = $this->validateWithdrawWindow();
// if (!$windowValidation['can_withdraw']) { ... }
```

**Solução 2 - Ajustar configuração:**
```sql
-- Permitir saques todos os dias
UPDATE settings 
SET value = '{"days":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"start":"00:00","end":"23:59"}'
WHERE key = 'withdraw.window';
```

---

### ❌ Erro: "Valor abaixo do mínimo"

**Causa:** Valor solicitado menor que `withdraw.min`

**Solução:**
```sql
-- Ver configuração atual
SELECT * FROM settings WHERE key = 'withdraw.min';

-- Ajustar valor mínimo
UPDATE settings SET value = '10' WHERE key = 'withdraw.min';
```

---

### ❌ Erro: "Limite diário atingido"

**Causa:** Usuário já fez o saque permitido hoje

**Solução:**
```sql
-- Ver saques de hoje
SELECT * FROM withdrawals 
WHERE user_id = 1 
AND DATE(requested_at) = CURRENT_DATE
AND status NOT IN ('REJECTED', 'CANCELLED');

-- Remover saque de teste (se necessário)
DELETE FROM withdrawals WHERE id = X;

-- OU aumentar o limite
UPDATE settings SET value = '5' WHERE key = 'withdraw.daily_limit_per_user';
```

---

### ❌ Erro: "SQLSTATE[23502]: Not null violation"

**Causa:** Campo obrigatório faltando no INSERT

**Verificar estrutura das tabelas:**
```bash
php artisan tinker
>>> Schema::getColumnListing('withdrawals');
>>> Schema::getColumnListing('ledger');
```

**Colunas obrigatórias em `withdrawals`:**
- user_id
- amount
- fee_amount
- net_amount
- cpf
- pix_key
- pix_key_type
- status
- requested_at

**Colunas obrigatórias em `ledger`:**
- user_id
- type
- reference_type
- reference_id
- description
- amount
- operation
- balance_type

---

### ❌ Erro: "Erro ao processar: Invalid IP address"

**Causa:** API Vizzion rejeitando IP local (127.0.0.1)

**Solução:** O código já está configurado para usar IP fixo `89.116.74.42`

**Verificar:**
```bash
grep -n "89.116.74.42" app/Http/Controllers/API/V1/WithdrawController.php
```

---

### ❌ Erro: "Name must contain only letters and spaces"

**Causa:** Nome do usuário tem caracteres especiais (acentos, números, etc)

**Solução:** O código já normaliza o nome usando `normalizeOwnerName()`

**Verificar:**
```php
// No WithdrawController.php, procurar por:
private function normalizeOwnerName(string $name): string
```

---

## 📊 Verificar Logs

```bash
# Ver últimos erros de saque
tail -f storage/logs/laravel.log | grep -i "saque\|withdrawal"

# Ver últimos 100 logs
tail -100 storage/logs/laravel.log

# Filtrar por erro específico
grep "Erro ao processar saque" storage/logs/laravel.log | tail -20
```

---

## 🧪 Teste Completo Passo a Passo

```bash
# 1. Criar usuário de teste
php artisan tinker
>>> $user = User::create(['name' => 'Teste Saque', 'email' => 'teste@saque.com', 'password' => Hash::make('senha123'), 'cpf' => '12345678901', 'balance_withdrawn' => 100, 'referral_code' => Str::random(20)]);

# 2. Criar ciclo
>>> $cycle = Cycle::create(['user_id' => $user->id, 'plan_id' => 1, 'amount' => 50, 'type' => 'DAILY', 'status' => 'ACTIVE', 'duration_days' => 30, 'days_paid' => 0, 'started_at' => now(), 'ends_at' => now()->addDays(30)]);

# 3. Testar saque
php test_withdrawal.php [user_id] 50

# 4. Se passar, testar pela API
curl -X POST https://eco-vacs.store/api/v1/withdrawals \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50, "cpf": "12345678901", "pix_key": "12345678901", "pix_key_type": "cpf"}'
```

---

## 🔑 Configurações Importantes

```sql
-- Ver todas as configurações de saque
SELECT * FROM settings WHERE key LIKE 'withdraw%';

-- Configurações recomendadas para teste
UPDATE settings SET value = '10' WHERE key = 'withdraw.min';
UPDATE settings SET value = '0.05' WHERE key = 'withdraw.fee';
UPDATE settings SET value = '5' WHERE key = 'withdraw.daily_limit_per_user';
UPDATE settings SET value = '{"days":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"start":"00:00","end":"23:59"}' WHERE key = 'withdraw.window';
```

---

## 📞 Suporte

Se o erro persistir após verificar todos os itens acima:

1. Execute o script de teste: `php test_withdrawal.php [user_id] [amount]`
2. Copie o output completo
3. Verifique os logs: `tail -100 storage/logs/laravel.log`
4. Forneça as informações acima para análise

---

**Última atualização:** 10/11/2025

