# ✅ Validação de Ciclo Finalizado para Saques

## 📋 O que foi implementado

Foi adicionada uma **validação obrigatória** no sistema de saques que impede usuários de realizar saques antes de completarem pelo menos **1 ciclo**.

---

## 🔧 Alterações Técnicas

### Arquivo: `app/Http/Controllers/API/V1/WithdrawController.php`

#### 1. Import adicionado:
```php
use App\Models\Cycle;
```

#### 2. Nova validação no método `store()`:
```php
// 1. Validar se o usuário tem pelo menos 1 ciclo finalizado
$finishedCyclesCount = Cycle::where('user_id', $user->id)
    ->where('status', 'FINISHED')
    ->count();

if ($finishedCyclesCount < 1) {
    return response()->json([
        'error' => [
            'code' => 'NO_FINISHED_CYCLES',
            'message' => 'Você precisa ter pelo menos 1 ciclo finalizado para realizar saques.',
            'details' => [
                'finished_cycles' => $finishedCyclesCount,
                'required_cycles' => 1,
            ]
        ]
    ], 400);
}
```

---

## 🎯 Como Funciona

### Status de Ciclos
- **ACTIVE**: Ciclo em andamento (NÃO conta para saque)
- **FINISHED**: Ciclo finalizado (CONTA para saque)
- **CANCELLED/EXPIRED**: Ciclos cancelados (NÃO contam)

### Regra de Negócio
1. Usuário faz investimento → Ciclo criado com status `ACTIVE`
2. Ciclo recebe pagamentos diários (tipo `DAILY`) ou aguarda final (tipo `END_CYCLE`)
3. Quando `days_paid >= duration_days` → Status muda para `FINISHED`
4. **SOMENTE APÓS TER 1+ CICLOS `FINISHED`** → Usuário pode sacar

---

## 📊 Ordem de Validações no Saque

Agora o fluxo de validação segue esta ordem:

```
1. ✅ Validar se tem pelo menos 1 ciclo FINISHED (NOVO!)
2. ✅ Validar janela de saque (dias úteis, horário)
3. ✅ Validar limite diário de saques
4. ✅ Validar valor mínimo
5. ✅ Calcular taxa e valor líquido
6. ✅ Validar saldo disponível
7. ✅ Validar chave PIX
8. ✅ Criar registro de saque
9. ✅ Debitar saldo do usuário
10. ✅ Registrar no ledger
11. ✅ Processar automaticamente (até R$ 300) ou enviar para admin
```

---

## 🧪 Testes

### Cenário 1: Usuário SEM ciclo finalizado
**Request:**
```json
POST /api/v1/withdrawals
{
  "amount": 50,
  "cpf": "12345678901",
  "pix_key": "12345678901",
  "pix_key_type": "cpf"
}
```

**Response (400 Bad Request):**
```json
{
  "error": {
    "code": "NO_FINISHED_CYCLES",
    "message": "Você precisa ter pelo menos 1 ciclo finalizado para realizar saques.",
    "details": {
      "finished_cycles": 0,
      "required_cycles": 1
    }
  }
}
```

### Cenário 2: Usuário COM ciclo finalizado
**Request:** (mesmo de cima)

**Response (201 Created):**
```json
{
  "data": {
    "id": 123,
    "amount": 50.00,
    "fee_amount": 5.00,
    "net_amount": 45.00,
    "status": "REQUESTED",
    "requested_at": "2025-11-10T12:00:00Z",
    "message": "Saque solicitado com sucesso! Processando transferência automaticamente..."
  }
}
```

---

## 🛠️ Deploy no Servidor

### Opção 1: Via SSH (comandos diretos)
```bash
cd /app

# Backup
cp app/Http/Controllers/API/V1/WithdrawController.php app/Http/Controllers/API/V1/WithdrawController.php.backup

# Adicionar import
sed -i 's/use App\\Models\\Ledger;/use App\\Models\\Ledger;\nuse App\\Models\\Cycle;/g' app/Http/Controllers/API/V1/WithdrawController.php

# Inserir validação (ver arquivo DEPLOY_CYCLE_VALIDATION.txt)

# Limpar caches
php artisan optimize:clear
composer dump-autoload -o
```

### Opção 2: Upload manual
```bash
# Local
scp app/Http/Controllers/API/V1/WithdrawController.php root@servidor:/app/app/Http/Controllers/API/V1/

# Servidor
cd /app
php artisan optimize:clear
composer dump-autoload -o
```

---

## 📁 Arquivos Relacionados

- `app/Http/Controllers/API/V1/WithdrawController.php` - Controller atualizado
- `app/Models/Cycle.php` - Model de ciclos
- `DEPLOY_CYCLE_VALIDATION.txt` - Comandos para deploy
- `APPLY_CYCLE_VALIDATION.sh` - Script automatizado (Linux)

---

## ✅ Checklist de Deploy

- [ ] Fazer backup do `WithdrawController.php`
- [ ] Adicionar import do `Cycle` model
- [ ] Inserir validação de ciclo
- [ ] Renumerar comentários (1→2, 2→3, etc.)
- [ ] Limpar caches (`php artisan optimize:clear`)
- [ ] Recarregar autoload (`composer dump-autoload -o`)
- [ ] Testar com usuário SEM ciclo (deve dar erro)
- [ ] Testar com usuário COM ciclo (deve funcionar)
- [ ] Verificar logs (`tail -f storage/logs/laravel.log`)

---

## 🔍 Debug

### Ver ciclos de um usuário
```bash
php artisan tinker
>>> \App\Models\Cycle::where('user_id', 1)->get(['id', 'status', 'started_at', 'ends_at', 'days_paid', 'duration_days']);
```

### Criar ciclo FINISHED para teste
```bash
php artisan tinker
>>> $cycle = \App\Models\Cycle::create([
    'user_id' => 1,
    'plan_id' => 1,
    'amount' => 100,
    'type' => 'DAILY',
    'duration_days' => 30,
    'started_at' => now()->subDays(31),
    'ends_at' => now()->subDay(),
    'status' => 'FINISHED',
    'days_paid' => 30,
]);
```

### Verificar logs de saque
```bash
tail -f storage/logs/laravel.log | grep -i "cycle\|saque"
```

---

## 📞 Suporte

Se houver problemas:

1. Verificar se o import do `Cycle` foi adicionado
2. Verificar se a validação está no lugar certo (logo após `try {`)
3. Limpar todos os caches novamente
4. Verificar logs em `storage/logs/laravel.log`
5. Testar via API diretamente (Postman/curl)

---

**Data de Implementação:** 10/11/2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para Deploy

