-- ================================================
-- Query para verificar webhooks atrasados
-- ================================================

-- 1. Contar webhooks por status
SELECT 
    status,
    COUNT(*) as total,
    SUM(CASE WHEN deposit_id IS NOT NULL THEN 1 ELSE 0 END) as com_deposit
FROM webhook_events
GROUP BY status
ORDER BY total DESC;

-- 2. Listar webhooks com status 'late_arrival'
SELECT 
    we.id as webhook_id,
    we.provider,
    we.status,
    we.deposit_id,
    we.created_at as webhook_created,
    d.amount as deposit_amount,
    d.status as deposit_status,
    d.paid_at as deposit_paid_at,
    d.user_id
FROM webhook_events we
LEFT JOIN deposits d ON we.deposit_id = d.id
WHERE we.status = 'late_arrival'
ORDER BY we.created_at DESC
LIMIT 20;

-- 3. Listar webhooks manuais aguardando
SELECT 
    we.id as webhook_id,
    we.provider,
    we.status,
    we.deposit_id,
    we.created_at as webhook_created,
    d.amount as deposit_amount,
    d.status as deposit_status,
    d.paid_at as deposit_paid_at,
    d.user_id,
    EXTRACT(EPOCH FROM (NOW() - we.created_at))/3600 as hours_waiting
FROM webhook_events we
LEFT JOIN deposits d ON we.deposit_id = d.id
WHERE we.status = 'manual_pending_webhook'
ORDER BY we.created_at DESC
LIMIT 20;

-- 4. Verificar depósitos PAID com múltiplos webhooks (possível indicador de webhook atrasado)
SELECT 
    d.id as deposit_id,
    d.user_id,
    d.amount,
    d.status,
    d.paid_at,
    COUNT(we.id) as total_webhooks,
    STRING_AGG(we.status, ', ' ORDER BY we.created_at) as webhook_statuses
FROM deposits d
LEFT JOIN webhook_events we ON d.id = we.deposit_id
WHERE d.status = 'PAID'
GROUP BY d.id, d.user_id, d.amount, d.status, d.paid_at
HAVING COUNT(we.id) > 1
ORDER BY d.paid_at DESC
LIMIT 20;

-- 5. Depósitos PAID recentes (últimas 24h) e seus webhooks
SELECT 
    d.id as deposit_id,
    d.user_id,
    d.amount,
    d.status as deposit_status,
    d.paid_at,
    we.id as webhook_id,
    we.status as webhook_status,
    we.provider,
    we.created_at as webhook_created
FROM deposits d
LEFT JOIN webhook_events we ON d.id = we.deposit_id
WHERE d.status = 'PAID' 
  AND d.paid_at >= NOW() - INTERVAL '24 hours'
ORDER BY d.paid_at DESC, we.created_at DESC;

