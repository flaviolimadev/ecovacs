# 🔍 Queries Úteis - Sistema de Comissões

Queries SQL para monitorar, debugar e analisar o sistema de comissões MLM.

---

## 📊 Dashboard de Comissões

### Total de Comissões Distribuídas (Geral)
```sql
SELECT 
    COUNT(*) as total_comissoes,
    SUM(amount) as valor_total_distribuido,
    AVG(amount) as valor_medio,
    MIN(amount) as menor_comissao,
    MAX(amount) as maior_comissao
FROM commissions;
```

### Comissões por Tipo
```sql
SELECT 
    type as tipo_comissao,
    COUNT(*) as quantidade,
    SUM(amount) as valor_total,
    AVG(amount) as valor_medio
FROM commissions
GROUP BY type;
```

**Resultado esperado:**
```
tipo_comissao          | quantidade | valor_total | valor_medio
-----------------------|------------|-------------|------------
FIRST_PURCHASE         | 15         | 2,700.00    | 180.00
SUBSEQUENT_PURCHASE    | 8          | 880.00      | 110.00
```

### Comissões por Nível
```sql
SELECT 
    level as nivel,
    COUNT(*) as quantidade,
    SUM(amount) as valor_total,
    AVG(amount) as valor_medio,
    AVG(percentage) as percentual_medio
FROM commissions
GROUP BY level
ORDER BY level;
```

**Resultado esperado:**
```
nivel | quantidade | valor_total | valor_medio | percentual_medio
------|------------|-------------|-------------|-----------------
1     | 10         | 1,500.00    | 150.00      | 11.50
2     | 10         | 200.00      | 20.00       | 2.00
3     | 10         | 100.00      | 10.00       | 1.00
```

---

## 👥 Análise por Usuário

### Top 10 Usuários que Mais Receberam Comissões
```sql
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(c.id) as total_comissoes,
    SUM(c.amount) as total_recebido,
    u.balance_withdrawn as saldo_atual_saque
FROM users u
LEFT JOIN commissions c ON c.user_id = u.id
GROUP BY u.id, u.name, u.email, u.balance_withdrawn
ORDER BY total_recebido DESC
LIMIT 10;
```

### Comissões Recebidas por Usuário Específico
```sql
SELECT 
    c.id,
    c.created_at as data,
    c.level as nivel,
    c.amount as valor,
    c.percentage as percentual,
    c.type as tipo_comissao,
    c.description as descricao,
    fu.name as comprador,
    c.purchase_amount as valor_compra
FROM commissions c
JOIN users fu ON fu.id = c.from_user_id
WHERE c.user_id = <ID_USUARIO>
ORDER BY c.created_at DESC;
```

### Usuários que Geraram Mais Comissões (Compradores Top)
```sql
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(c.id) as compras_que_geraram_comissoes,
    SUM(c.amount) as total_comissoes_geradas
FROM users u
LEFT JOIN commissions c ON c.from_user_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY total_comissoes_geradas DESC
LIMIT 10;
```

---

## 🌳 Análise de Árvore (Rede)

### Ver Árvore de Indicações de um Usuário
```sql
-- Nível 1 (Diretos)
SELECT 
    u.id,
    u.name,
    u.email,
    u.referral_code,
    u.created_at as data_cadastro
FROM users u
WHERE u.referred_by = <ID_USUARIO>;

-- Nível 2 (Indiretos)
SELECT 
    u2.id,
    u2.name,
    u2.email,
    u1.name as indicador_direto
FROM users u2
JOIN users u1 ON u2.referred_by = u1.id
WHERE u1.referred_by = <ID_USUARIO>;

-- Nível 3 (Indiretos de Indiretos)
SELECT 
    u3.id,
    u3.name,
    u3.email,
    u2.name as nivel_2,
    u1.name as nivel_1
FROM users u3
JOIN users u2 ON u3.referred_by = u2.id
JOIN users u1 ON u2.referred_by = u1.id
WHERE u1.referred_by = <ID_USUARIO>;
```

### Contagem de Membros por Nível
```sql
WITH RECURSIVE network AS (
    -- Ponto inicial (usuário raiz)
    SELECT 
        id, 
        name, 
        referred_by, 
        1 as level
    FROM users
    WHERE id = <ID_USUARIO>
    
    UNION ALL
    
    -- Recursão (buscar indicados)
    SELECT 
        u.id, 
        u.name, 
        u.referred_by, 
        n.level + 1
    FROM users u
    INNER JOIN network n ON u.referred_by = n.id
    WHERE n.level < 3  -- Limitar a 3 níveis
)
SELECT 
    level as nivel,
    COUNT(*) as total_membros
FROM network
WHERE level > 0
GROUP BY level
ORDER BY level;
```

---

## 💰 Análise Financeira

### Total de Comissões vs Total Investido
```sql
SELECT 
    SUM(cycles.amount) as total_investido,
    SUM(commissions.amount) as total_comissoes_distribuidas,
    (SUM(commissions.amount) / SUM(cycles.amount) * 100) as percentual_comissionado
FROM cycles
LEFT JOIN commissions ON commissions.cycle_id = cycles.id;
```

### Balanço Geral dos Usuários
```sql
SELECT 
    COUNT(*) as total_usuarios,
    SUM(balance) as saldo_total_investir,
    SUM(balance_withdrawn) as saldo_total_sacar,
    SUM(total_invested) as total_investido,
    SUM(total_earned) as total_ganho,
    SUM(total_withdrawn) as total_sacado
FROM users;
```

### ROI de Comissões por Usuário
```sql
SELECT 
    u.id,
    u.name,
    u.total_invested as valor_investido,
    COALESCE(SUM(c.amount), 0) as comissoes_recebidas,
    u.balance_withdrawn as saldo_disponivel_saque,
    (COALESCE(SUM(c.amount), 0) / NULLIF(u.total_invested, 0) * 100) as roi_percentual
FROM users u
LEFT JOIN commissions c ON c.user_id = u.id
GROUP BY u.id, u.name, u.total_invested, u.balance_withdrawn
HAVING u.total_invested > 0
ORDER BY roi_percentual DESC;
```

---

## 📅 Relatórios por Período

### Comissões por Dia (Últimos 30 dias)
```sql
SELECT 
    DATE(created_at) as data,
    COUNT(*) as quantidade,
    SUM(amount) as total_distribuido
FROM commissions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;
```

### Comissões por Mês (Último Ano)
```sql
SELECT 
    EXTRACT(YEAR FROM created_at) as ano,
    EXTRACT(MONTH FROM created_at) as mes,
    COUNT(*) as quantidade,
    SUM(amount) as total_distribuido
FROM commissions
WHERE created_at >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY 
    EXTRACT(YEAR FROM created_at),
    EXTRACT(MONTH FROM created_at)
ORDER BY ano DESC, mes DESC;
```

### Comissões de Hoje
```sql
SELECT 
    c.id,
    c.created_at,
    u.name as beneficiario,
    fu.name as comprador,
    c.level as nivel,
    c.amount as valor,
    c.description
FROM commissions c
JOIN users u ON u.id = c.user_id
JOIN users fu ON fu.id = c.from_user_id
WHERE DATE(c.created_at) = CURRENT_DATE
ORDER BY c.created_at DESC;
```

---

## 🔎 Auditoria e Debug

### Verificar Integridade de Comissões
```sql
-- Verificar se todas as comissões têm cycles válidos
SELECT 
    c.id,
    c.cycle_id,
    cy.id as cycle_exists
FROM commissions c
LEFT JOIN cycles cy ON cy.id = c.cycle_id
WHERE cy.id IS NULL;
```

**Se retornar linhas:** Há comissões órfãs (sem cycle correspondente) ⚠️

### Verificar Inconsistências em balance_withdrawn
```sql
-- Saldo de saque deve ser >= comissões recebidas
SELECT 
    u.id,
    u.name,
    u.balance_withdrawn as saldo_saque,
    COALESCE(SUM(c.amount), 0) as total_comissoes,
    (u.balance_withdrawn - COALESCE(SUM(c.amount), 0)) as diferenca
FROM users u
LEFT JOIN commissions c ON c.user_id = u.id
GROUP BY u.id, u.name, u.balance_withdrawn
HAVING (u.balance_withdrawn - COALESCE(SUM(c.amount), 0)) < -0.01;
```

**Se retornar linhas:** Há usuários com saldo menor que comissões ⚠️

### Trace de Comissões de uma Compra Específica
```sql
SELECT 
    cy.id as cycle_id,
    cy.amount as valor_compra,
    cy.is_first_purchase as primeira_compra,
    u_buyer.name as comprador,
    c.level as nivel,
    u_receiver.name as beneficiario,
    c.amount as comissao,
    c.percentage as percentual,
    c.description
FROM cycles cy
JOIN users u_buyer ON u_buyer.id = cy.user_id
LEFT JOIN commissions c ON c.cycle_id = cy.id
LEFT JOIN users u_receiver ON u_receiver.id = c.user_id
WHERE cy.id = <CYCLE_ID>
ORDER BY c.level;
```

### Últimas 50 Comissões Processadas
```sql
SELECT 
    c.id,
    c.created_at,
    u.name as beneficiario,
    fu.name as comprador,
    c.level,
    c.amount,
    c.type,
    c.description
FROM commissions c
JOIN users u ON u.id = c.user_id
JOIN users fu ON fu.id = c.from_user_id
ORDER BY c.created_at DESC
LIMIT 50;
```

---

## 📈 Métricas de Crescimento

### Novos Usuários vs Comissões Geradas
```sql
SELECT 
    DATE(u.created_at) as data_cadastro,
    COUNT(u.id) as novos_usuarios,
    COUNT(cy.id) as compras_realizadas,
    COALESCE(SUM(c.amount), 0) as comissoes_geradas
FROM users u
LEFT JOIN cycles cy ON cy.user_id = u.id 
    AND DATE(cy.created_at) = DATE(u.created_at)
LEFT JOIN commissions c ON c.cycle_id = cy.id
WHERE u.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(u.created_at)
ORDER BY data_cadastro DESC;
```

### Taxa de Conversão (Cadastro → Compra)
```sql
SELECT 
    COUNT(DISTINCT u.id) as total_usuarios,
    COUNT(DISTINCT cy.user_id) as usuarios_compraram,
    (COUNT(DISTINCT cy.user_id)::float / COUNT(DISTINCT u.id) * 100) as taxa_conversao_percentual
FROM users u
LEFT JOIN cycles cy ON cy.user_id = u.id;
```

---

## 🚨 Alertas e Monitoramento

### Usuários com Muito Saldo de Saque (Possível Fraude)
```sql
SELECT 
    u.id,
    u.name,
    u.email,
    u.balance_withdrawn,
    u.total_earned,
    u.total_invested,
    (u.balance_withdrawn / NULLIF(u.total_invested, 0)) as ratio_saque_investimento
FROM users u
WHERE u.balance_withdrawn > 10000  -- Ajustar threshold
ORDER BY u.balance_withdrawn DESC;
```

### Comissões Muito Altas (Suspeitas)
```sql
SELECT 
    c.id,
    c.created_at,
    u.name as beneficiario,
    c.amount,
    c.purchase_amount,
    c.percentage
FROM commissions c
JOIN users u ON u.id = c.user_id
WHERE c.amount > 1000  -- Ajustar threshold
ORDER BY c.amount DESC;
```

---

## 🛠️ Manutenção

### Recalcular total_earned de um Usuário
```sql
UPDATE users
SET total_earned = (
    SELECT COALESCE(SUM(amount), 0)
    FROM commissions
    WHERE user_id = users.id
)
WHERE id = <ID_USUARIO>;
```

### Recalcular balance_withdrawn de um Usuário
```sql
-- CUIDADO: Certifique-se de que é necessário!
UPDATE users
SET balance_withdrawn = (
    SELECT COALESCE(SUM(amount), 0)
    FROM commissions
    WHERE user_id = users.id
)
WHERE id = <ID_USUARIO>;
```

### Limpar Comissões de Teste
```sql
-- ⚠️ USAR COM CUIDADO EM DESENVOLVIMENTO
DELETE FROM commissions
WHERE created_at < '2025-11-07';  -- Ajustar data
```

---

## 📊 Query Completa de Dashboard

```sql
-- Dashboard executivo de comissões
SELECT 
    'Total Distribuído' as metrica,
    CONCAT('R$ ', TO_CHAR(SUM(amount), 'FM999,999,990.00')) as valor
FROM commissions

UNION ALL

SELECT 
    'Total de Comissões' as metrica,
    COUNT(*)::text as valor
FROM commissions

UNION ALL

SELECT 
    'Usuários Recebendo' as metrica,
    COUNT(DISTINCT user_id)::text as valor
FROM commissions

UNION ALL

SELECT 
    'Média por Comissão' as metrica,
    CONCAT('R$ ', TO_CHAR(AVG(amount), 'FM999,999,990.00')) as valor
FROM commissions

UNION ALL

SELECT 
    'Primeira Compra (18%)' as metrica,
    COUNT(*)::text as valor
FROM commissions
WHERE type = 'FIRST_PURCHASE'

UNION ALL

SELECT 
    'Compras Subsequentes (11%)' as metrica,
    COUNT(*)::text as valor
FROM commissions
WHERE type = 'SUBSEQUENT_PURCHASE';
```

---

## ✅ Uso Recomendado

1. **Desenvolvimento:** Use todas as queries livremente
2. **Produção:** 
   - Somente queries SELECT
   - Cuidado com queries sem WHERE (scan completo)
   - Sempre adicionar LIMIT
   - Monitorar performance

---

Essas queries ajudam a monitorar, debugar e otimizar o sistema de comissões! 🚀

