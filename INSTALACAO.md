# 🚀 Guia de Instalação - Laravel + React SPA

## ✅ O que foi feito

A integração do React com Laravel foi concluída com sucesso! Agora você tem:

- ✅ React + TypeScript configurado no Vite
- ✅ Todos os componentes Shadcn UI migrados
- ✅ Tailwind CSS integrado
- ✅ React Router funcionando
- ✅ Rotas de API configuradas em `/api/v1/*`
- ✅ SPA fallback route configurada
- ✅ Assets movidos para `public/assets/`

## 📁 Estrutura do Projeto

```
app/
├── resources/
│   ├── js/
│   │   ├── app.tsx              # Entry point do React
│   │   ├── components/          # Componentes React + Shadcn UI
│   │   ├── pages/               # Páginas da aplicação
│   │   ├── hooks/               # Hooks customizados
│   │   └── lib/                 # Utilitários
│   ├── css/
│   │   └── app.css              # Estilos Tailwind + variáveis CSS
│   └── views/
│       └── app.blade.php        # View que hospeda a SPA
├── routes/
│   ├── web.php                  # Rota SPA fallback
│   └── api.php                  # Rotas de API (/api/v1/*)
├── public/
│   └── assets/                  # Imagens e assets estáticos
└── package.json                 # Dependências React

```

## 🔧 Instalação

### 1. Instalar dependências PHP

```bash
cd app
composer install
```

### 2. Instalar dependências Node.js

```bash
npm install
```

### 3. Configurar ambiente

```bash
# Copiar .env (se necessário)
cp .env.example .env

# Gerar chave da aplicação
php artisan key:generate
```

### 4. Configurar banco de dados

Edite o arquivo `.env` e configure suas credenciais do PostgreSQL:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=seu_banco
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
```

### 5. Rodar migrations (quando criar)

```bash
php artisan migrate
```

## 🚀 Rodar o Projeto

### Desenvolvimento (2 terminais)

**Terminal 1 - Laravel:**
```bash
php artisan serve
```

**Terminal 2 - Vite (React):**
```bash
npm run dev
```

Acesse: `http://localhost:8000`

### Ou rodar tudo junto (1 terminal)

Se você tiver `concurrently` instalado:
```bash
composer dev
```

## 📦 Build para Produção

```bash
# Build do React
npm run build

# O Laravel vai servir os arquivos do build automaticamente
```

## 🔌 Rotas Disponíveis

### Frontend (React Router)
- `/` - Dashboard
- `/members` - Membros da rede
- `/earnings` - Rendimentos
- `/profile` - Perfil do usuário
- `/deposit` - Depósito
- `/withdraw` - Saque
- `/login` - Login
- `/register` - Registro

### Backend (API)
Todas as rotas começam com `/api/v1`:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/profile`
- `GET /api/v1/settings`
- `GET /api/v1/plans`
- `POST /api/v1/investments`
- `GET /api/v1/investments/{id}`
- `GET /api/v1/statement`
- `POST /api/v1/withdrawals`
- `GET /api/v1/network`

## 🎨 Tecnologias Usadas

### Frontend
- React 18
- TypeScript
- React Router v6
- Shadcn UI (Radix UI)
- Tailwind CSS
- TanStack Query
- Zod
- Lucide Icons

### Backend
- Laravel 12
- PHP 8.2
- PostgreSQL

### Build
- Vite 7
- Laravel Vite Plugin

## 📝 Próximos Passos

1. **Implementar autenticação**: Laravel Sanctum ou Passport
2. **Criar migrations**: Conforme `04-dynamic-rules-db.mdc`
3. **Implementar controllers**: Para as rotas de API
4. **Criar jobs**: Para processar rendimentos e comissões
5. **Conectar frontend ao backend**: Substituir dados mockados por chamadas reais à API

## 🐛 Troubleshooting

### Erro: "Vite manifest not found"
```bash
npm run build
```

### Erro: Assets não carregam
Verifique se os assets estão em `app/public/assets/`

### Erro de CORS
Adicione ao `.env`:
```env
SANCTUM_STATEFUL_DOMAINS=localhost:8000
SESSION_DOMAIN=localhost
```

## 📚 Documentação

- [Laravel 11](https://laravel.com/docs/11.x)
- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

✨ **Projeto integrado com sucesso!** ✨











