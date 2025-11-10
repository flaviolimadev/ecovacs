# 🚨 SOLUÇÃO RÁPIDA - Problema de Acesso Admin

## ❌ PROBLEMA
Ao acessar `/admin/users`, você é redirecionado para `/` (home).

## ✅ CAUSA
Seu usuário **não tem role `admin`** no banco de dados.

---

## 🔧 SOLUÇÃO 1: VIA NAVEGADOR (MAIS RÁPIDO)

1. **Acesse o site**: https://ecovacs-app.woty8c.easypanel.host
2. **Pressione F12** (abrir Console do navegador)
3. **Cole este código** e pressione Enter:

```javascript
// Atualizar role via API
fetch('https://ecovacs-app.woty8c.easypanel.host/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@ecovacs.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(adminData => {
  const adminToken = adminData.data.token;
  
  // Pegar seu ID de usuário
  return fetch('https://ecovacs-app.woty8c.easypanel.host/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@admin.com',
      password: 'SUA_SENHA_AQUI'  // ⚠️ TROQUE!
    })
  })
  .then(r => r.json())
  .then(userData => {
    const userId = userData.data.user.id;
    console.log('Seu user ID:', userId);
    
    // Promover para admin usando a conta admin@ecovacs.com
    return fetch(`https://ecovacs-app.woty8c.easypanel.host/api/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'admin' })
    });
  });
})
.then(r => r.json())
.then(result => {
  console.log('✅ SUCESSO! Você agora é admin!');
  console.log(result);
  
  // Fazer logout e login novamente
  localStorage.clear();
  alert('✅ Pronto! Faça login novamente.');
  location.href = '/login';
})
.catch(err => console.error('❌ Erro:', err));
```

4. **Faça login novamente** com `admin@admin.com`
5. **Acesse**: https://ecovacs-app.woty8c.easypanel.host/admin/users
6. ✅ **DEVE FUNCIONAR!**

---

## 🔧 SOLUÇÃO 2: VIA SQL (BANCO DE DADOS)

Se você tem acesso ao banco PostgreSQL:

```sql
-- Atualizar role para admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@admin.com';

-- Verificar
SELECT id, email, role FROM users WHERE email = 'admin@admin.com';
```

---

## 🔧 SOLUÇÃO 3: USAR CONTA PADRÃO

Use a conta admin que já existe:

```
Email: admin@ecovacs.com
Senha: admin123
```

Esta conta **já é admin** e funciona!

Acesse: https://ecovacs-app.woty8c.easypanel.host/login

---

## 📋 VERIFICAR SE FUNCIONOU

Depois de aplicar a solução, abra o Console (F12) e cole:

```javascript
// Ver dados do localStorage
const user = JSON.parse(localStorage.getItem('user'));
console.log('Email:', user.email);
console.log('Role:', user.role);

if (user.role === 'admin') {
  console.log('✅ Você é ADMIN!');
  location.href = '/admin/users';
} else {
  console.log('❌ Role ainda não é admin:', user.role);
}
```

---

## 🎯 RESUMO

**Problema:** Role não é `admin` no banco  
**Solução:** Atualizar via API/SQL ou usar `admin@ecovacs.com`  
**Teste:** Fazer logout/login e acessar `/admin/users`

✅ **Pronto para usar!**

