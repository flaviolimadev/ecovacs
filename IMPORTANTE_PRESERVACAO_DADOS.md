# ⚠️ IMPORTANTE: Preservação de Dados no Banco

## 🚨 PROBLEMA IDENTIFICADO

**Sintoma:** Ao fazer deploy/importar código, as compras e comissões eram zeradas.

**Causa Raiz:** O `PlansSeeder.php` estava usando `Plan::truncate()` na linha 17, que **APAGAVA TODOS OS PLANOS** toda vez que o seeder rodava!

```php
// ❌ CÓDIGO PROBLEMÁTICO (REMOVIDO)
Plan::truncate(); // Apaga TODOS os planos e quebra referências!
```

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Removido `truncate()` do PlansSeeder

**Antes:**
```php
public function run(): void
{
    Plan::truncate(); // ❌ Apaga tudo!
    
    foreach ($standardPlans as $plan) {
        Plan::create($plan);
    }
}
```

**Depois:**
```php
public function run(): void
{
    // ✅ Não apaga nada, apenas cria se não existir
    
    foreach ($standardPlans as $plan) {
        Plan::firstOrCreate(
            ['name' => $plan['name']], // Buscar por nome
            $plan // Criar apenas se não existir
        );
    }
}
```

### 2. AdminUserSeeder já estava seguro

O `AdminUserSeeder` JÁ verificava se o usuário admin existia antes de criar:

```php
$existingAdmin = User::where('email', 'admin@admin.com')->first();

if ($existingAdmin) {
    // Não cria novamente, apenas avisa
    return;
}
```

## 🛡️ Proteções Implementadas

### ✅ Seeders são Idempotentes

Agora os seeders podem ser executados MÚLTIPLAS VEZES sem danificar dados:

1. **AdminUserSeeder**: Verifica se existe antes de criar
2. **PlansSeeder**: Usa `firstOrCreate()` - cria apenas se não existir

### ✅ Migrations são Incrementais

O `start.sh` usa `php artisan migrate --force` (sem `fresh`), que:
- ✅ Adiciona novas tabelas/colunas
- ✅ **NÃO apaga** dados existentes
- ✅ Só executa migrations que ainda não rodaram

### ✅ Relacionamentos Protegidos

As foreign keys usam `onDelete('cascade')` ou `restrict`:

```php
// Exemplo: se apagar um plano, NÃO apaga os ciclos (restringe)
$table->foreignId('plan_id')->constrained()->onDelete('restrict');

// Exemplo: se apagar um usuário, apaga suas transações (cascata)
$table->foreignId('user_id')->constrained()->onDelete('cascade');
```

## 🚫 COMANDOS PERIGOSOS (NUNCA USAR EM PRODUÇÃO)

### ❌ NUNCA EXECUTE ESTES COMANDOS EM PRODUÇÃO:

```bash
# ❌ APAGA TODO O BANCO E RECRIA DO ZERO
php artisan migrate:fresh

# ❌ APAGA TODO O BANCO E RECRIA COM SEEDERS
php artisan migrate:fresh --seed

# ❌ REVERTE TODAS AS MIGRATIONS (apaga tabelas)
php artisan migrate:reset

# ❌ REVERTE E REEXECUTA (pode perder dados)
php artisan migrate:refresh
```

### ✅ COMANDOS SEGUROS EM PRODUÇÃO:

```bash
# ✅ Adiciona novas migrations (seguro)
php artisan migrate --force

# ✅ Executa seeders (agora idempotentes)
php artisan db:seed --force

# ✅ Reverte a última migration (cuidado, mas não apaga tudo)
php artisan migrate:rollback --step=1

# ✅ Limpar caches (seguro)
php artisan config:clear
php artisan route:clear
php artisan cache:clear
```

## 📝 Boas Práticas

### 1. Seeders Idempotentes

Sempre use `firstOrCreate()` ou verifique existência:

```php
// ✅ BOM: Cria apenas se não existir
Plan::firstOrCreate(
    ['name' => $planName],
    $allPlanData
);

// ✅ BOM: Verifica antes de criar
if (!User::where('email', $email)->exists()) {
    User::create($userData);
}

// ❌ RUIM: Sempre cria (causa duplicatas)
Plan::create($planData);
```

### 2. Migrations Reversíveis

```php
public function up()
{
    Schema::create('table', function (Blueprint $table) {
        // ...
    });
}

public function down()
{
    Schema::dropIfExists('table'); // Permite reverter
}
```

### 3. Backups Regulares

Configure backups automáticos do PostgreSQL:

```bash
# Backup manual
pg_dump -h host -U user -d database > backup.sql

# Restaurar backup
psql -h host -U user -d database < backup.sql
```

## 🔍 Verificar Integridade dos Dados

### Antes de Deploy

```sql
-- Contar registros importantes
SELECT 'users' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'cycles', COUNT(*) FROM cycles
UNION ALL
SELECT 'commissions', COUNT(*) FROM commissions
UNION ALL
SELECT 'ledger', COUNT(*) FROM ledger
UNION ALL
SELECT 'plans', COUNT(*) FROM plans;
```

### Depois de Deploy

Execute a mesma query e compare os totais. Se diminuiu, algo apagou dados!

## 📊 Monitoramento

### Log de Seeders

O PlansSeeder agora mostra se criou ou já existia:

```
✅ 3 planos padrão criados!
ℹ️  Planos ciclo já existem (nenhum criado)
🎉 Total de planos no sistema: 9
```

### Verificar Logs

```bash
# Ver logs do Laravel
tail -f storage/logs/laravel.log

# Ver logs do PostgreSQL (Easypanel)
docker logs ecovacs_bancodados
```

## 🎯 Checklist de Deploy Seguro

Antes de fazer deploy:

- [ ] Verificar que seeders usam `firstOrCreate()` ou verificam existência
- [ ] Confirmar que `start.sh` usa `migrate` (não `migrate:fresh`)
- [ ] Fazer backup do banco de dados
- [ ] Testar em ambiente de staging primeiro
- [ ] Verificar contagem de registros antes e depois

Durante o deploy:

- [ ] Monitorar logs em tempo real
- [ ] Verificar que seeders não criaram duplicatas
- [ ] Testar login e funcionalidades críticas
- [ ] Verificar contagem de ciclos/comissões

Depois do deploy:

- [ ] Confirmar que dados existentes permanecem
- [ ] Testar nova compra
- [ ] Verificar extratos
- [ ] Validar comissões

## 🆘 Se Dados Foram Perdidos

### 1. Parar o Servidor Imediatamente

```bash
# Easypanel: Parar o serviço
```

### 2. Restaurar Backup

```bash
# Se tiver backup recente
psql -h host -U user -d database < backup_YYYY-MM-DD.sql
```

### 3. Verificar Logs

```bash
# Ver o que aconteceu
cat storage/logs/laravel.log | grep -i "truncate\|drop\|delete"
```

### 4. Recriar Dados Críticos

Se não houver backup, pelo menos garanta que:
- ✅ Usuário admin existe
- ✅ Planos estão cadastrados
- ✅ Variáveis de ambiente estão corretas

## 📋 Resumo

| Item | Status | Descrição |
|------|--------|-----------|
| **PlansSeeder** | ✅ CORRIGIDO | Remove `truncate()`, usa `firstOrCreate()` |
| **AdminUserSeeder** | ✅ JÁ SEGURO | Verifica antes de criar |
| **start.sh** | ✅ SEGURO | Usa `migrate` (não `fresh`) |
| **Migrations** | ✅ SEGURO | Incrementais, não destrutivas |
| **Foreign Keys** | ✅ PROTEGIDO | Usa `restrict` para planos |

---

**Data:** 2025-11-07
**Status:** ✅ PROBLEMA RESOLVIDO
**Prioridade:** 🔴 CRÍTICA

**NUNCA MAIS:** Usar `truncate()` ou `migrate:fresh` em produção!











