# 🚀 Deploy no Easypanel - Guia Completo

## 📋 Pré-requisitos

- ✅ Conta no Easypanel
- ✅ Banco de dados PostgreSQL criado no Easypanel
- ✅ Código commitado no Git

---

## 🔧 Configuração no Easypanel

### 1. Criar Banco de Dados PostgreSQL

1. No Easypanel, vá em **Services** → **New Service**
2. Escolha **PostgreSQL**
3. Configure:
   - **Name**: `ecovacs_bancodados`
   - **Database**: `ecovacs`
   - **Username**: `postgres`
   - **Password**: (será gerado automaticamente)
4. Clique em **Create**

### 2. Criar Aplicação Laravel

1. Vá em **Apps** → **New App**
2. Escolha **From Git Repository**
3. Configure:
   - **Name**: `ecovacs-app`
   - **Repository**: URL do seu repositório Git
   - **Branch**: `main` ou `master`

### 3. Configurar Variáveis de Ambiente

No Easypanel, vá em **App Settings** → **Environment Variables** e adicione:

```bash
# Laravel Basic
APP_NAME=Laravel
APP_ENV=production
APP_KEY=base64:7ZB5C3+NqUto5Qo0+AXl0eR7lPOsqKxPEo/UTbzgHZY=
APP_DEBUG=false
APP_URL=https://sua-url-app.easypanel.host

# Database (ajustar com valores do PostgreSQL criado)
DB_CONNECTION=pgsql
DB_HOST=ecovacs_bancodados
DB_PORT=5432
DB_DATABASE=ecovacs
DB_USERNAME=postgres
DB_PASSWORD=sua-senha-do-banco
DB_SSLMODE=disable

# Session & Cache
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

# Vite Frontend
VITE_API_URL=https://sua-url-app.easypanel.host/api

# Sanctum
SANCTUM_STATEFUL_DOMAINS=sua-url-app.easypanel.host,localhost
```

### 4. Configurar Build

O Easypanel usará o **Nixpacks** automaticamente. O arquivo `nixpacks.toml` já está configurado para:

1. ✅ Instalar PHP 8.2
2. ✅ Instalar Node.js 20
3. ✅ Instalar Composer
4. ✅ Instalar dependências PHP (`composer install`)
5. ✅ Instalar dependências Node (`npm ci`)
6. ✅ Buildar frontend (`npm run build`)
7. ✅ Cachear rotas e configs do Laravel
8. ✅ Rodar migrations automaticamente
9. ✅ Criar usuário admin
10. ✅ Criar planos

---

## 📦 Arquivos Importantes

### `nixpacks.toml`
Configuração do build para Nixpacks (já criado).

### `start.sh`
Script de inicialização que:
- Aguarda o banco de dados
- Roda migrations
- Cria storage link
- Seeda dados iniciais
- Inicia servidor

### `.dockerignore`
Ignora arquivos desnecessários no build.

---

## 🔑 Gerar APP_KEY

Se precisar gerar uma nova `APP_KEY`:

```bash
php artisan key:generate --show
```

Cole o resultado no Easypanel como variável de ambiente `APP_KEY`.

---

## 🗄️ Configuração do Banco de Dados

### Nome do Host

O host do banco deve ser o **nome do serviço** criado no Easypanel:

```bash
DB_HOST=ecovacs_bancodados  # Nome do serviço PostgreSQL
```

### SSL Mode

Para PostgreSQL no Easypanel:

```bash
DB_SSLMODE=disable
```

---

## 🚀 Deploy

### Primeiro Deploy

1. Commit todos os arquivos:
   ```bash
   git add .
   git commit -m "Configuração para Easypanel"
   git push
   ```

2. No Easypanel, clique em **Deploy**

3. Acompanhe os logs:
   - ✅ Build do frontend
   - ✅ Instalação de dependências
   - ✅ Migrations
   - ✅ Seeders
   - ✅ Servidor iniciado

### Deploys Subsequentes

Sempre que fizer mudanças:

```bash
git add .
git commit -m "Suas mudanças"
git push
```

O Easypanel detectará automaticamente e fará redeploy.

---

## 📊 Verificar Status

### Logs da Aplicação

No Easypanel: **App** → **Logs**

Você verá:
```
🚀 Iniciando aplicação Laravel...
⏳ Aguardando banco de dados...
📦 Executando migrations...
👤 Criando usuário admin...
📋 Criando planos...
✅ Iniciando servidor na porta 8000...
```

### Testar a API

```bash
# Health check
curl https://sua-url-app.easypanel.host/up

# Login admin
curl -X POST https://sua-url-app.easypanel.host/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@admin.com",
    "password": "admin123"
  }'
```

---

## 🐛 Troubleshooting

### Erro: "npm: command not found"

**Solução:** Verifique se `nixpacks.toml` está commitado e tem Node.js nos `nixPkgs`.

### Erro: "Connection refused" (banco de dados)

**Soluções:**
1. Verifique se o serviço PostgreSQL está rodando
2. Verifique `DB_HOST` (deve ser o nome do serviço)
3. Verifique se a senha está correta

### Erro: "Route not found"

**Solução:** Limpe e recrie os caches:
```bash
php artisan route:clear
php artisan route:cache
```

### Erro: "Class not found"

**Solução:** Reotimize o autoloader:
```bash
composer dump-autoload --optimize
```

### Build falha no `npm run build`

**Soluções:**
1. Certifique-se que `package.json` está correto
2. Verifique se `vite.config.js` existe
3. Adicione `--verbose` ao comando para mais detalhes

---

## 🔐 Segurança

### Ambiente de Produção

Sempre use em produção:

```bash
APP_ENV=production
APP_DEBUG=false
```

### Senhas

⚠️ **NUNCA** commite senhas no Git!

Todas as senhas devem estar nas **Environment Variables** do Easypanel, não no código.

---

## 📈 Monitoramento

### Verificar Uso de Recursos

No Easypanel: **App** → **Metrics**

- CPU
- Memória
- Requisições

### Logs

Para ver logs em tempo real:
- Easypanel: **App** → **Logs** → **Live**

---

## 🔄 Rollback

Se algo der errado:

1. No Easypanel: **App** → **Deployments**
2. Escolha um deploy anterior
3. Clique em **Rollback to this deployment**

---

## ✅ Checklist de Deploy

- [ ] `nixpacks.toml` criado
- [ ] `start.sh` criado e executável
- [ ] `.dockerignore` criado
- [ ] PostgreSQL criado no Easypanel
- [ ] Environment variables configuradas
- [ ] `APP_KEY` gerada
- [ ] `DB_HOST` correto (nome do serviço)
- [ ] `VITE_API_URL` correto
- [ ] Código commitado e pushed
- [ ] Deploy feito no Easypanel
- [ ] Logs verificados
- [ ] Login admin testado

---

## 🎉 Usuário Admin Padrão

Após o primeiro deploy:

```
Email: admin@admin.com
Senha: admin123
Código de Indicação: ADMIN001
```

⚠️ **Altere a senha imediatamente após o primeiro login!**

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs no Easypanel
2. Teste a conexão com o banco
3. Verifique as variáveis de ambiente
4. Consulte a documentação do Laravel
5. Consulte a documentação do Nixpacks

---

## 🔗 Links Úteis

- [Documentação do Easypanel](https://easypanel.io/docs)
- [Documentação do Nixpacks](https://nixpacks.com/)
- [Laravel Deployment](https://laravel.com/docs/deployment)
- [Vite Build](https://vitejs.dev/guide/build.html)

---

**Pronto! Sua aplicação Laravel + React está rodando no Easypanel! 🚀**

