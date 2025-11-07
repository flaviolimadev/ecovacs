# ✅ Planos/Produtos Cadastrados no Banco de Dados

## 📋 Resumo das Mudanças

Os produtos/planos que eram exibidos de forma hardcoded no frontend agora estão armazenados no banco de dados PostgreSQL e são carregados dinamicamente via API.

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `plans`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | bigint | ID único do plano |
| `name` | varchar(255) | Nome do plano (com emoji) |
| `image` | varchar(255) | Caminho da imagem |
| `price` | numeric(18,2) | Valor do plano |
| `daily_income` | numeric(18,2) | Renda diária (null para planos ciclo) |
| `duration_days` | integer | Duração em dias |
| `total_return` | numeric(18,2) | Retorno total |
| `max_purchases` | integer | Máximo de compras simultâneas (0 = ilimitado) |
| `type` | enum | `DAILY` ou `END_CYCLE` |
| `description` | text | Descrição adicional (nullable) |
| `is_active` | boolean | Plano ativo (default: true) |
| `order` | integer | Ordem de exibição (default: 0) |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |

**Índices:**
- ✅ `plans_is_active_index` (is_active)
- ✅ `plans_type_index` (type)
- ✅ `plans_order_index` (order)

---

## 📦 Planos Cadastrados

### Planos Padrão (DAILY) - 6 planos

| ID | Nome | Preço | Renda Diária | Duração | Retorno Total | Max Compras |
|----|------|-------|--------------|---------|---------------|-------------|
| 1 | 🤖 Ecovacs Deebot T8 Robot | R$ 50,00 | R$ 5,00 | 20 dias | R$ 100,00 | 1 |
| 2 | 🤖 Ecovacs Deebot T80 Omni | R$ 150,00 | R$ 12,00 | 25 dias | R$ 300,00 | 1 |
| 3 | 🤖 Ecovacs Deebot X8 Pro Omni | R$ 300,00 | R$ 30,00 | 22 dias | R$ 660,00 | 1 |
| 4 | 🤖 Ecovacs Deebot N30 Omni | R$ 600,00 | R$ 43,00 | 30 dias | R$ 1.290,00 | 2 |
| 5 | 🤖 Ecovacs Deebot T20 Omni | R$ 1.200,00 | R$ 85,00 | 30 dias | R$ 2.550,00 | 2 |
| 6 | 🤖 Ecovacs Deebot T50 Omni | R$ 2.500,00 | R$ 187,50 | 32 dias | R$ 6.000,00 | 4 |

### Planos Ciclo (END_CYCLE) - 3 planos

| ID | Nome | Preço | Duração | Retorno Total | Max Compras |
|----|------|-------|---------|---------------|-------------|
| 7 | 🤖 Plano Ciclo 45 Dias | R$ 500,00 | 45 dias | R$ 2.250,00 | Ilimitado |
| 8 | 🤖 Plano Ciclo 60 Dias | R$ 1.500,00 | 60 dias | R$ 10.800,00 | Ilimitado |
| 9 | 🤖 Plano Ciclo 90 Dias | R$ 2.500,00 | 90 dias | R$ 31.500,00 | Ilimitado |

**Total:** 9 planos cadastrados ✅

---

## 🔧 Arquivos Criados/Modificados

### Backend

1. **Migration:** `database/migrations/2025_11_06_234821_create_plans_table.php`
   - Cria a tabela `plans` com todos os campos e índices

2. **Model:** `app/Models/Plan.php`
   - Define campos fillable e casts
   - Scopes úteis: `active()`, `byType()`, `ordered()`

3. **Seeder:** `database/seeders/PlansSeeder.php`
   - Popula a tabela com os 9 planos
   - Executa `Plan::truncate()` antes de inserir (apenas em dev)

4. **Controller:** `app/Http/Controllers/API/V1/PlanController.php`
   - `index()`: Lista todos os planos ativos, agrupados por tipo
   - `show($id)`: Retorna um plano específico

5. **Rotas:** `routes/api.php`
   - `GET /api/v1/plans` - Lista todos os planos
   - `GET /api/v1/plans/{id}` - Busca um plano específico

### Frontend

6. **Componente:** `resources/js/components/ProductsSection.tsx`
   - **Antes:** Dados hardcoded em arrays
   - **Depois:** Busca planos da API via `plansAPI.getAll()`
   - Adiciona loading state e tratamento de erros
   - Formata dados do banco para o formato esperado pelo `ProductCard`

7. **API Client:** `resources/js/lib/api.ts`
   - Já tinha o método `plansAPI.getAll()` implementado

---

## 🚀 API Endpoints

### GET /api/v1/plans

Lista todos os planos ativos, agrupados por tipo.

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "message": "Planos carregados com sucesso",
  "data": {
    "standard": [
      {
        "id": 1,
        "name": "🤖 Ecovacs Deebot T8 Robot",
        "image": "/assets/ecovacs-t8.jpg",
        "price": "50.00",
        "daily_income": "5.00",
        "duration_days": 20,
        "total_return": "100.00",
        "max_purchases": 1,
        "type": "DAILY",
        "is_active": true,
        "order": 1
      }
      // ... mais planos
    ],
    "cycle": [
      {
        "id": 7,
        "name": "🤖 Plano Ciclo 45 Dias",
        "image": "/assets/ecovacs-t50.jpg",
        "price": "500.00",
        "daily_income": null,
        "duration_days": 45,
        "total_return": "2250.00",
        "max_purchases": 0,
        "type": "END_CYCLE",
        "description": "Lucro no final do ciclo + devolução do capital investido",
        "is_active": true,
        "order": 7
      }
      // ... mais planos
    ]
  }
}
```

### GET /api/v1/plans/{id}

Retorna um plano específico.

**Resposta:**
```json
{
  "message": "Plano encontrado",
  "data": {
    "id": 1,
    "name": "🤖 Ecovacs Deebot T8 Robot",
    "image": "/assets/ecovacs-t8.jpg",
    "price": "50.00",
    "daily_income": "5.00",
    "duration_days": 20,
    "total_return": "100.00",
    "max_purchases": 1,
    "type": "DAILY",
    "is_active": true,
    "order": 1
  }
}
```

---

## 💡 Funcionalidades do Model

### Scopes Disponíveis

```php
// Apenas planos ativos
Plan::active()->get();

// Planos por tipo
Plan::byType('DAILY')->get();
Plan::byType('END_CYCLE')->get();

// Planos ordenados
Plan::ordered()->get();

// Combinando scopes
Plan::active()->byType('DAILY')->ordered()->get();
```

---

## 🧪 Como Testar

### 1. Testar no Tinker

```bash
# Ver todos os planos
php artisan tinker
>>> App\Models\Plan::all();

# Ver apenas planos ativos
>>> App\Models\Plan::active()->get();

# Ver planos por tipo
>>> App\Models\Plan::byType('DAILY')->get();
>>> App\Models\Plan::byType('END_CYCLE')->get();

# Ver planos ordenados
>>> App\Models\Plan::ordered()->get();
```

### 2. Testar na API

```bash
# Fazer login primeiro
POST http://localhost:8000/api/v1/auth/login
{
  "email": "admin@admin.com",
  "password": "admin123"
}

# Copiar o token da resposta

# Buscar planos
GET http://localhost:8000/api/v1/plans
Authorization: Bearer {seu_token}
```

### 3. Testar no Frontend

1. Acesse: `http://localhost:5173`
2. Faça login com `admin@admin.com` / `admin123`
3. Role a página para ver a seção "Planos de Rendimento Progressivo"
4. Os planos devem ser carregados da API
5. Verifique o console do navegador para ver a requisição

---

## 📝 Comandos Úteis

```bash
# Executar migration
php artisan migrate

# Executar seeder
php artisan db:seed --class=PlansSeeder

# Recriar planos (limpa e recria)
php artisan db:seed --class=PlansSeeder

# Ver estrutura da tabela
php artisan db:table plans

# Contar planos
php artisan tinker --execute="echo App\Models\Plan::count();"

# Ver planos agrupados por tipo
php artisan tinker --execute="echo App\Models\Plan::select('type', DB::raw('count(*) as total'))->groupBy('type')->get();"
```

---

## 🎨 Interface do Usuário

### Estados do Frontend

**Loading:**
```
🔄 [Spinner girando]
Carregando planos...
```

**Sucesso:**
```
📦 Planos de Rendimento Progressivo

[Tab: Padrão] [Tab: Ciclo]

[Cards dos planos...]
```

**Sem planos:**
```
📦 [Ícone de pacote]
Nenhum plano padrão disponível
```

---

## ✅ Benefícios

### 1. **Gerenciamento Dinâmico**
- ✅ Adicionar/editar planos sem alterar código
- ✅ Ativar/desativar planos facilmente
- ✅ Reordenar planos pela coluna `order`

### 2. **Escalabilidade**
- ✅ Suporta quantidade ilimitada de planos
- ✅ Tipos de planos extensíveis (pode adicionar novos tipos)
- ✅ Campos flexíveis (description para informações adicionais)

### 3. **Manutenibilidade**
- ✅ Código centralizado no backend
- ✅ Frontend apenas consome a API
- ✅ Fácil de testar e validar

### 4. **Performance**
- ✅ Índices no banco para queries rápidas
- ✅ Frontend faz cache dos planos
- ✅ Loading state para melhor UX

---

## 🔮 Próximos Passos

Agora que os planos estão no banco, você pode:

1. ✅ Criar painel admin para gerenciar planos
2. ✅ Implementar compra de planos (`POST /investments`)
3. ✅ Validar se usuário tem saldo suficiente
4. ✅ Validar limite de compras simultâneas
5. ✅ Criar ciclos de investimento
6. ✅ Implementar jobs de rendimento diário
7. ✅ Implementar jobs de fechamento de ciclo

---

## ✅ Status Final

- [x] Migration criada e executada
- [x] Model Plan criado com scopes úteis
- [x] Seeder criado com 9 planos
- [x] Planos inseridos no PostgreSQL
- [x] Controller API criado
- [x] Rotas API configuradas
- [x] Frontend atualizado para buscar da API
- [x] Loading states implementados
- [x] Tratamento de erros
- [x] Formatação de dados
- [x] Documentação completa

**Os produtos estão agora completamente dinâmicos e gerenciáveis pelo banco de dados!** 🎉

