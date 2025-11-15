# ✅ Campos Únicos Implementado

## 📋 Resumo das Mudanças

Implementado constraint única (unique) nos campos **email** e **phone** da tabela `users`.

---

## 🗄️ Migration

### Criada:
- `2025_11_06_233427_add_unique_constraint_to_phone_in_users_table.php`

### Alterações:
- Adicionado índice único ao campo `phone` na tabela `users`
- O campo `email` já tinha constraint única desde a migration inicial

### Observação Importante:
- O campo `phone` é **nullable**, mas pode ter constraint única
- SQLite/MySQL/PostgreSQL permitem múltiplos valores `NULL` em campos únicos
- Apenas valores não-nulos precisam ser únicos

---

## 📝 Validações Atualizadas

### 1. RegisterRequest (Cadastro)

**Antes:**
```php
'phone' => ['nullable', 'string', 'max:20'],
```

**Depois:**
```php
'phone' => ['nullable', 'string', 'max:20', 'unique:users,phone'],
```

**Mensagem de erro adicionada:**
```php
'phone.unique' => 'Este telefone já está cadastrado',
```

### 2. UpdateProfileRequest (Atualização de Perfil)

**Antes:**
```php
'phone' => ['nullable', 'string', 'max:20'],
```

**Depois:**
```php
'phone' => ['nullable', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($userId)],
```

**Mensagem de erro adicionada:**
```php
'phone.unique' => 'Este telefone já está em uso',
```

**Nota:** A regra `ignore($userId)` é importante para permitir que o usuário atualize seu próprio perfil sem alterar o telefone (não considera o próprio registro como duplicata).

---

## 🎯 Comportamento Esperado

### Registro (Register)
1. ❌ Se o email já existir → erro: "Este email já está cadastrado"
2. ❌ Se o telefone já existir (e não for null) → erro: "Este telefone já está cadastrado"
3. ✅ Se o telefone for null → permitido (múltiplos null são aceitos)
4. ✅ Se ambos forem únicos → cadastro realizado

### Atualização de Perfil (Profile Update)
1. ❌ Se o email já existir em outro usuário → erro: "Este email já está em uso"
2. ❌ Se o telefone já existir em outro usuário → erro: "Este telefone já está em uso"
3. ✅ Se o telefone for null → permitido
4. ✅ Se mantiver o mesmo email/telefone → permitido (ignora o próprio usuário)

---

## 🧪 Testes

### Teste 1: Registro com email duplicado
```bash
POST /api/v1/auth/register
{
  "name": "Teste",
  "email": "existente@email.com", // Já cadastrado
  "password": "123456",
  "password_confirmation": "123456",
  "referral_code": "ABC12345"
}

Resposta: 422 - "Este email já está cadastrado"
```

### Teste 2: Registro com telefone duplicado
```bash
POST /api/v1/auth/register
{
  "name": "Teste",
  "email": "novo@email.com",
  "phone": "(11) 99999-9999", // Já cadastrado
  "password": "123456",
  "password_confirmation": "123456",
  "referral_code": "ABC12345"
}

Resposta: 422 - "Este telefone já está cadastrado"
```

### Teste 3: Atualização com telefone de outro usuário
```bash
PUT /api/v1/profile
Authorization: Bearer {token}
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "(11) 88888-8888" // Pertence a outro usuário
}

Resposta: 422 - "Este telefone já está em uso"
```

---

## 📦 Arquivos Modificados

1. `database/migrations/2025_11_06_233427_add_unique_constraint_to_phone_in_users_table.php` (novo)
2. `app/Http/Requests/Auth/RegisterRequest.php`
3. `app/Http/Requests/Profile/UpdateProfileRequest.php`

---

## ✅ Status

- [x] Migration criada e aplicada
- [x] Validação de email único (já existia)
- [x] Validação de phone único adicionada
- [x] Mensagens de erro em português
- [x] Regra `ignore()` no update para não conflitar com próprio registro
- [x] Banco de dados recriado com `migrate:fresh`

---

## 🚀 Próximos Passos

A implementação de campos únicos está completa. O sistema agora:

1. ✅ Garante que cada email seja único no banco
2. ✅ Garante que cada telefone não-nulo seja único
3. ✅ Valida na API antes de tentar inserir no banco
4. ✅ Retorna mensagens de erro claras em português
5. ✅ Permite que o usuário atualize seu perfil mantendo o mesmo email/telefone










