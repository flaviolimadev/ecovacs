-- Verificar usuário admin@admin.com
SELECT id, email, role FROM users WHERE email = 'admin@admin.com';

-- Atualizar role para admin
UPDATE users SET role = 'admin' WHERE email = 'admin@admin.com';

-- Verificar novamente
SELECT id, email, role FROM users WHERE email = 'admin@admin.com';

-- Ver todos os usuários
SELECT id, email, role FROM users ORDER BY id;

