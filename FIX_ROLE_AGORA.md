# 🚨 SOLUÇÃO URGENTE - Adicionar Campo ROLE

## ❌ PROBLEMA IDENTIFICADO
O campo `role` **não existe na tabela `users`** do banco de dados!

Por isso o login retorna `Role: undefined`.

---

## ✅ SOLUÇÃO RÁPIDA

### **OPÇÃO 1: Via Laravel Tinker (RECOMENDADO)**

Execute no servidor (via SSH):

```bash
cd /path/to/app
php artisan tinker
```

Depois cole:

```php
// Verificar se a coluna existe
Schema::hasColumn('users', 'role');

// Se retornar FALSE, adicionar a coluna:
DB::statement("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'user'");

// Atualizar usuário admin
$admin = \App\Models\User::find(6);
$admin->role = 'admin';
$admin->save();

echo "✅ Campo role adicionado e admin atualizado!";
exit;
```

---

### **OPÇÃO 2: SQL Direto (Se tiver acesso ao PostgreSQL)**

```sql
-- Adicionar coluna role
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'user';

-- Atualizar admin@ecovacs.com (ID 6)
UPDATE users 
SET role = 'admin' 
WHERE id = 6;

-- Verificar
SELECT id, email, role FROM users WHERE id = 6;
```

---

### **OPÇÃO 3: Executar a Migration**

No servidor (SSH):

```bash
cd /path/to/app
php artisan migrate --force
```

Isso vai executar a migration `2025_11_10_030000_add_role_to_users_table.php`

---

### **OPÇÃO 4: Script PHP Rápido**

Crie um arquivo `fix-role.php` na raiz do app com:

```php
<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔧 Adicionando campo role...\n";

// Adicionar coluna
DB::statement("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'user'");

echo "✅ Coluna role adicionada!\n";
echo "🔧 Atualizando admin...\n";

// Atualizar admin
$admin = \App\Models\User::find(6);
if ($admin) {
    $admin->role = 'admin';
    $admin->save();
    echo "✅ Admin atualizado! Email: {$admin->email}, Role: {$admin->role}\n";
} else {
    echo "❌ Admin não encontrado!\n";
}
```

Execute:
```bash
php fix-role.php
```

---

## 🧪 TESTAR SE FUNCIONOU

Depois de aplicar qualquer solução acima, teste no navegador (Console F12):

```javascript
// Fazer login novamente
fetch('https://ecovacs-app.woty8c.easypanel.host/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@ecovacs.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(data => {
  console.log('📧 Email:', data.data.user.email);
  console.log('🔑 Role:', data.data.user.role);
  
  if (data.data.user.role === 'admin') {
    console.log('✅ SUCESSO! Role está correto!');
    localStorage.setItem('auth_token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    setTimeout(() => location.href = '/admin/users', 1000);
  } else {
    console.error('❌ Role ainda undefined:', data.data.user.role);
  }
});
```

Se aparecer:
```
✅ SUCESSO! Role está correto!
```

**PRONTO! O problema está resolvido!** 🎉

---

## 📋 RESUMO

1. **Problema:** Campo `role` não existe na tabela `users`
2. **Causa:** Migration não foi executada no servidor de produção
3. **Solução:** Adicionar coluna `role` e setar `admin` para o usuário
4. **Teste:** Fazer login e verificar se `role: "admin"` aparece

✅ **Escolha uma das opções acima e execute!**

