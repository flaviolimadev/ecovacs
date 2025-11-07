# ✅ Usuário Administrador Criado

## 📋 Resumo

Foi criado um usuário administrador padrão no banco de dados PostgreSQL para testes e acesso inicial ao sistema.

---

## 👤 Credenciais do Administrador

```
📧 Email: admin@admin.com
🔐 Senha: admin123
🔑 Código de Indicação: ADMIN001
```

---

## 💰 Saldos Iniciais

O usuário admin foi criado com saldos para facilitar os testes:

| Tipo | Valor | Uso |
|------|-------|-----|
| **Saldo para Investir** | R$ 10.000,00 | Comprar planos/pacotes |
| **Saldo para Saque** | R$ 5.000,00 | Solicitar saques |
| **Total Investido** | R$ 5.000,00 | Histórico de investimentos |
| **Total Ganho** | R$ 5.000,00 | Histórico de ganhos |

---

## 📊 Dados Completos

```json
{
    "id": 1,
    "name": "Administrador",
    "email": "admin@admin.com",
    "referral_code": "ADMIN001",
    "balance": "10000.00",
    "balance_withdrawn": "5000.00",
    "is_active": true,
    "is_verified": true
}
```

---

## 🔑 Características Especiais

### Usuário Raiz
- ✅ **Sem indicador:** `referred_by = null`
- ✅ É o primeiro usuário do sistema
- ✅ Pode ser usado para indicar outros usuários
- ✅ Código de indicação fixo: `ADMIN001`

### Status
- ✅ **Ativo:** `is_active = true`
- ✅ **Verificado:** `is_verified = true`
- ✅ Email e telefone únicos no banco

---

## 📝 Arquivo Seeder

**Localização:** `database/seeders/AdminUserSeeder.php`

### Como usar:

```bash
# Criar o usuário admin
php artisan db:seed --class=AdminUserSeeder

# Se executar novamente, mostra que já existe
php artisan db:seed --class=AdminUserSeeder
```

### Proteção contra duplicatas:

O seeder verifica se o usuário já existe antes de criar. Se executar novamente:

```
⚠️  Usuário admin@admin.com já existe!
📧 Email: admin@admin.com
🔑 Código de Indicação: ADMIN001
```

---

## 🧪 Como Testar

### 1. Login via API

```bash
POST http://localhost:8000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@admin.com",
  "password": "admin123"
}
```

**Resposta esperada:**
```json
{
  "message": "Login realizado com sucesso!",
  "data": {
    "user": {
      "id": 1,
      "name": "Administrador",
      "email": "admin@admin.com",
      "phone": "(00) 00000-0000",
      "referral_code": "ADMIN001",
      "balance": 10000.00,
      "balance_withdrawn": 5000.00,
      "total_invested": 5000.00,
      "total_earned": 5000.00
    },
    "token": "1|..."
  }
}
```

### 2. Login via Frontend

1. Acesse: `http://localhost:5173/login`
2. Digite:
   - **Email:** admin@admin.com
   - **Senha:** admin123
3. Clique em "Entrar"

Você será redirecionado para a página inicial com os saldos disponíveis.

### 3. Usar código de indicação

Ao cadastrar novos usuários, use o código: **ADMIN001**

Exemplo:
```
http://localhost:5173/register?ref=ADMIN001
```

---

## 🔐 Segurança

### ⚠️ IMPORTANTE - Produção

Para uso em **produção**, você DEVE:

1. ❌ **NÃO** usar senha simples como "admin123"
2. ✅ Alterar a senha imediatamente após o primeiro login
3. ✅ Usar senha forte (mínimo 12 caracteres, letras, números e símbolos)
4. ✅ Habilitar autenticação de dois fatores (quando disponível)
5. ✅ Criar um email real (não admin@admin.com)
6. ✅ Limitar acesso por IP (se possível)

### Alteração de Senha

Após fazer login, vá em **Perfil** → **Alterar Senha**:

```bash
PUT /api/v1/profile/password
Authorization: Bearer {token}

{
  "current_password": "admin123",
  "new_password": "SenhaSuperSegura@2024",
  "new_password_confirmation": "SenhaSuperSegura@2024"
}
```

---

## 📦 Arquivos Relacionados

1. ✅ `database/seeders/AdminUserSeeder.php` (seeder)
2. ✅ `app/Models/User.php` (model)
3. ✅ `database/migrations/2025_11_06_225907_create_users_table.php` (migration)

---

## 🚀 Próximos Passos

Agora você pode:

1. ✅ Fazer login com o usuário admin
2. ✅ Testar todas as funcionalidades do sistema
3. ✅ Criar usuários de teste usando o código ADMIN001
4. ✅ Testar o sistema de indicação (referral)
5. ✅ Simular compras de planos (quando implementado)
6. ✅ Testar saques e depósitos

---

## 🎯 Comandos Úteis

```bash
# Verificar usuário admin
php artisan tinker --execute="App\Models\User::where('email', 'admin@admin.com')->first()"

# Recriar usuário admin (se necessário)
php artisan tinker --execute="App\Models\User::where('email', 'admin@admin.com')->delete()"
php artisan db:seed --class=AdminUserSeeder

# Listar todos os usuários
php artisan tinker --execute="App\Models\User::all(['id', 'name', 'email', 'referral_code'])"
```

---

## ✅ Status

- [x] Seeder criado
- [x] Usuário admin criado no PostgreSQL
- [x] Credenciais documentadas
- [x] Saldos iniciais configurados
- [x] Código de indicação gerado (ADMIN001)
- [x] Status ativo e verificado
- [x] Pronto para uso

**O sistema está pronto para testes!** 🎉

