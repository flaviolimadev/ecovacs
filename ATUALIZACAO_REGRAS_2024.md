# 🔄 Atualização de Regras - 2024

## 📋 Resumo das Mudanças

### 1. ✅ Depósitos e Saques

| Configuração | Antes | Depois |
|--------------|-------|--------|
| **Depósito mínimo** | R$ 50,00 | R$ 30,00 |
| **Saque mínimo** | R$ 50,00 | R$ 30,00 |
| **Taxa de saque** | 10% | 12% |
| **Horário de saque** | Seg-Sex, 10h-17h | **Seg-Dom, 10h-17h** |
| **Limite diário** | 1 saque/dia | 1 saque/dia (mantido) |

### 2. ✅ Comissões - Primeira Compra

| Nível | Antes | Depois |
|-------|-------|--------|
| **Nível 1** | 15% | **25%** ⬆️ |
| **Nível 2** | 2% | 2% (mantido) |
| **Nível 3** | 1% | 1% (mantido) |

### 3. ✅ Comissões - Segunda Compra em Diante

| Nível | Antes | Depois |
|-------|-------|--------|
| **Nível 1** | 8% | **13%** ⬆️ |
| **Nível 2** | 2% | **1%** ⬇️ |
| **Nível 3** | 1% | 1% (mantido) |

### 4. ✅ Comissões Residuais (sobre lucros)

| Nível | Percentual |
|-------|------------|
| **Nível 1** | 2,5% (mantido) |
| **Nível 2** | 0,5% (mantido) |
| **Nível 3** | 0,15% (mantido) |

---

## 📂 Arquivos Modificados

### Frontend (React/TypeScript)
- ✅ `resources/js/pages/Deposit.tsx` - Valor mínimo 30
- ✅ `resources/js/pages/Withdraw.tsx` - Valor mínimo 30, quick amounts
- ✅ `resources/js/pages/Members.tsx` - Comissões 25%, 13%, 1%
- ✅ `resources/js/components/WelcomePopup.tsx` - Comissões atualizadas

### Backend (Laravel/PHP)
- ✅ `database/seeders/WithdrawSettingsSeeder.php` - Settings atualizados
- ✅ `app/Actions/ProcessReferralCommissions.php` - Comissões 25%, 13%, 1%
- ✅ `app/Http/Controllers/API/V1/NetworkController.php` - Config de comissões

### Documentação (.cursor/rules)
- ✅ `04-dynamic-rules-db-mdc-tudo-dinamico-no-banco.mdc`
- ✅ `05-business-logic-mdc-modalidades-comissoes.mdc`

---

## 🚀 Deploy para Produção

### 1. **Backend (via SSH)**

```bash
# Conectar ao servidor
ssh root@SEU_SERVIDOR

# Navegar para o diretório do app
cd /app

# Atualizar código (se estiver no Git)
git pull origin main

# OU copiar arquivos manualmente via SFTP

# Atualizar banco de dados
mysql -u USER -p DATABASE < UPDATE_SETTINGS_2024.sql

# Limpar caches Laravel
php artisan optimize:clear
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Recachear
php artisan config:cache
php artisan route:cache

# Recompilar autoload
composer dump-autoload -o
```

### 2. **Frontend (Build já feito)**

O build do frontend já foi realizado localmente. Arquivos em `public/build/`:
- ✅ `app-DTOWaEVi.css` (103.78 kB)
- ✅ `app-BjG0wh3u.js` (722.64 kB)

**Upload via SFTP ou Git:**
```bash
# Se usando Git:
git add public/build/*
git commit -m "feat: atualiza valores mínimos e comissões 2024"
git push origin main

# No servidor:
cd /app
git pull origin main
```

---

## 🧪 Testes Necessários

### Após Deploy, testar:

1. **Página Inicial**
   - [ ] Popup de boas-vindas mostra novas comissões (25%, 13%)

2. **Página /members**
   - [ ] Tabela de comissões mostra 25%, 13%, 1%
   - [ ] Dados carregam corretamente da API

3. **Página /deposit**
   - [ ] Valor mínimo de R$ 30,00 é validado
   - [ ] Quick amounts incluem R$ 30

4. **Página /withdraw**
   - [ ] Valor mínimo de R$ 30,00 é validado
   - [ ] Taxa de 12% é aplicada corretamente
   - [ ] Horário: Segunda a Domingo, 10h-17h
   - [ ] Quick amounts incluem R$ 30

5. **Sistema de Comissões (Backend)**
   - [ ] Primeira compra gera 25% no nível 1
   - [ ] Segunda compra+ gera 13% no nível 1
   - [ ] Nível 2 gera 1% (segunda compra+)
   - [ ] Comissões creditam em `balance_withdrawn`

---

## 📊 Impacto Financeiro

### Aumento de Comissões:
- **1ª compra Nível 1:** +10% (15% → 25%)
- **2ª+ compra Nível 1:** +5% (8% → 13%)
- **2ª+ compra Nível 2:** -1% (2% → 1%)

### Taxa de Saque:
- **Aumento:** +2% (10% → 12%)

### Acesso a Saques:
- **Melhoria:** Agora disponível também aos finais de semana

---

## 🔍 Validação

### Comandos de Verificação (Backend):

```bash
# Verificar configurações no banco
mysql -u USER -p -e "
SELECT key, value, description 
FROM settings 
WHERE key IN ('withdraw.min', 'withdraw.fee', 'withdraw.window')
" DATABASE

# Verificar arquivo de comissões
grep -A 10 "FIRST_PURCHASE_RATES\|SUBSEQUENT_PURCHASE_RATES" \
  app/Actions/ProcessReferralCommissions.php
```

### Frontend (Browser):
- F12 → Console → Verificar chamadas API
- Testar fluxo completo de depósito e saque

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs: `tail -50 storage/logs/laravel.log`
2. Verificar cache: `php artisan optimize:clear`
3. Verificar build: `ls -lh public/build/`

---

**✅ Atualização concluída em:** 25/11/2024
**🎯 Status:** Pronto para produção
**👤 Responsável:** Sistema automatizado



