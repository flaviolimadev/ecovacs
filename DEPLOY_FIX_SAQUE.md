# 🚨 FIX URGENTE: Erro 500 ao Sacar

## ⚠️ PROBLEMA:
O código em produção está usando campos antigos do `ledger` que não existem mais.

## ✅ SOLUÇÃO:
Você precisa rodar a migration que corrige os campos.

---

## 📝 PASSOS PARA CORRIGIR (Easypanel):

### 1️⃣ **Acessar o Terminal do Container**
No Easypanel, vá até o serviço `ecovacs-app` e abra o **Terminal**.

### 2️⃣ **Rodar a Migration**
```bash
php artisan migrate
```

**Você verá algo como:**
```
Running migrations.
2025_11_10_100000_fix_ledger_records ........................... DONE
```

### 3️⃣ **Limpar Cache**
```bash
php artisan config:clear
php artisan cache:clear
php artisan optimize:clear
```

### 4️⃣ **Reiniciar o Serviço (Opcional)**
No Easypanel, clique em "Restart" no serviço.

---

## 🔍 SE AINDA NÃO FUNCIONAR:

### Verificar se a migration foi aplicada:
```bash
php artisan migrate:status
```

Procure por: `2025_11_10_100000_fix_ledger_records` - deve estar com status **Ran**.

### Verificar a estrutura do ledger:
```bash
php artisan tinker
```

Dentro do Tinker:
```php
// Ver quantos registros tem
\App\Models\Ledger::count();

// Ver registros com problema
\App\Models\Ledger::whereNull('reference_type')->count();

// Ver o último registro
\App\Models\Ledger::latest()->first();

// Sair
exit
```

---

## 🛠️ SE A MIGRATION NÃO EXISTIR EM PRODUÇÃO:

Você pode rodar manualmente:

```bash
php artisan tinker
```

Depois cole isso:

```php
// Corrigir operation NULL
DB::table('ledger')->whereNull('operation')->update(['operation' => 'CREDIT']);

// Corrigir WITHDRAWAL
DB::table('ledger')->where('type', 'WITHDRAWAL')->whereNull('reference_type')->update(['reference_type' => 'App\\Models\\Withdrawal']);

// Corrigir DEPOSIT
DB::table('ledger')->where('type', 'DEPOSIT')->where('reference_type', 'DEPOSIT')->update(['reference_type' => 'App\\Models\\Deposit']);

echo "Corrigido!\n";
exit
```

---

## ⚡ TESTE RÁPIDO:

Depois de rodar os comandos acima, teste novamente:

1. Acesse: https://ecovacs-app.woty8c.easypanel.host/withdraw
2. Preencha os dados
3. Clique em "Solicitar Saque"

**Deve funcionar sem erro 500!** ✅

---

## 🆘 SE NADA FUNCIONAR:

Me envie a saída destes comandos:

```bash
# Ver últimas linhas do log
tail -100 storage/logs/laravel.log

# Ver status das migrations
php artisan migrate:status | grep ledger

# Ver estrutura da tabela ledger
php artisan tinker --execute="DB::select('SHOW COLUMNS FROM ledger');"
```

