-- ========================================
-- Script de Atualização de Regras 2024
-- ========================================
-- Este script atualiza os valores mínimos, taxa e horários
-- das configurações de saque/depósito

-- 1. Atualizar valor mínimo de saque (R$ 50 → R$ 30)
UPDATE settings
SET value = '30'
WHERE key = 'withdraw.min';

-- 2. Atualizar taxa de saque (10% → 12%)
UPDATE settings
SET value = '0.12'
WHERE key = 'withdraw.fee';

-- 3. Atualizar janela de horário de saque (Seg-Sex → Seg-Dom)
UPDATE settings
SET value = '{"days":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"start":"10:00","end":"17:00"}'
WHERE key = 'withdraw.window';

-- 4. Verificar se foi atualizado corretamente
SELECT key, value, description
FROM settings
WHERE key IN ('withdraw.min', 'withdraw.fee', 'withdraw.window');

-- ========================================
-- Comissões não precisam de atualização no banco
-- pois estão hardcoded no código (ProcessReferralCommissions.php)
-- e já foram atualizadas no backend
-- ========================================

