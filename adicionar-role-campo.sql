-- ============================================
-- SCRIPT SQL: Adicionar campo ROLE na tabela USERS
-- ============================================

-- 1. Adicionar coluna role (se não existir)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'user';

-- 2. Atualizar admin@ecovacs.com para admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@ecovacs.com';

-- 3. Atualizar admin@admin.com para admin (se existir)
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@admin.com';

-- 4. Verificar todos os usuários
SELECT id, email, role, created_at 
FROM users 
ORDER BY id;

-- 5. Verificar apenas admins
SELECT id, email, role 
FROM users 
WHERE role = 'admin';

