# ⚡ Quick Start - Comandos Rápidos

## 🚀 Instalação Rápida (copiar e colar)

```bash
# 1. Entrar na pasta do projeto
cd app

# 2. Instalar dependências PHP
composer install

# 3. Instalar dependências Node.js
npm install

# 4. Copiar .env
cp .env.example .env

# 5. Gerar chave do Laravel
php artisan key:generate

# 6. Configurar banco no .env (PostgreSQL)
# Edite o arquivo .env com suas credenciais

# 7. Rodar migrations (quando criar)
# php artisan migrate
```

## ▶️ Rodar Desenvolvimento

### Opção 1: Dois Terminais (Recomendado)

**Terminal 1 - Laravel:**
```bash
cd app
php artisan serve
```

**Terminal 2 - Vite/React:**
```bash
cd app
npm run dev
```

Depois acesse: **http://localhost:8000**

### Opção 2: Um Terminal (com concurrently)

```bash
cd app
composer dev
```

## 📦 Build de Produção

```bash
cd app
npm run build
```

Os arquivos compilados vão para `public/build/`

## 🧹 Limpar Cache

```bash
cd app

# Limpar cache do Laravel
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Limpar node_modules (se necessário)
rm -rf node_modules
npm install
```

## 🔍 Comandos Úteis

### Ver rotas do Laravel
```bash
php artisan route:list
```

### Ver rotas de API
```bash
php artisan route:list --path=api
```

### Criar migration
```bash
php artisan make:migration create_users_table
```

### Criar controller
```bash
php artisan make:controller API/V1/UserController --api
```

### Criar model
```bash
php artisan make:model User -mfsc
# -m = migration
# -f = factory
# -s = seeder
# -c = controller
```

### Rodar seeder
```bash
php artisan db:seed
```

### Criar job
```bash
php artisan make:job ProcessPayment
```

## 📊 Estrutura do Projeto

```
app/
├── 📂 resources/js/        → Código React
├── 📂 public/assets/       → Imagens estáticas
├── 📂 routes/              → Rotas Laravel
│   ├── web.php            → SPA fallback
│   └── api.php            → APIs REST
├── 📂 app/                 → Backend Laravel
├── 📄 vite.config.js      → Config do Vite
├── 📄 package.json        → Deps React
└── 📄 composer.json       → Deps Laravel
```

## 🎯 URLs Importantes

| URL | Descrição |
|-----|-----------|
| http://localhost:8000 | Aplicação (SPA) |
| http://localhost:8000/api/v1/* | APIs REST |
| http://localhost:8000/up | Health check |

## 🐛 Resolver Problemas

### Erro: "Vite manifest not found"
```bash
npm run build
```

### Erro: "Class not found"
```bash
composer dump-autoload
```

### Erro: "Permission denied"
```bash
chmod -R 775 storage bootstrap/cache
```

### Assets não carregam
```bash
# Verificar se existem em:
ls public/assets/
```

### Port 8000 em uso
```bash
# Usar outra porta:
php artisan serve --port=8080
```

## 📚 Documentação Completa

- **Instalação detalhada**: `INSTALACAO.md`
- **Resumo da integração**: `RESUMO_INTEGRACAO.md`
- **Regras do projeto**: `.cursor/rules/`

---

## ✨ Próximo Passo

Depois de instalar e rodar, acesse:
**http://localhost:8000**

Você verá o dashboard do seu projeto funcionando! 🎉

---

**Problemas?** Abra os arquivos de documentação acima.











