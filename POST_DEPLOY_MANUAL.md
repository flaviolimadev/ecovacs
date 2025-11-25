# 🚀 Como Fazer Deploy Manual

Sempre que fizer `git push` e o deploy automático não estiver configurado, rode este comando no servidor:

## Comando Completo (Copiar e Colar)

```bash
cd /app && bash deploy.sh
```

## Ou, se preferir linha por linha:

```bash
cd /app
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
composer dump-autoload -o
echo "✅ Deploy concluído!"
```

## Verificar Rotas

```bash
php artisan route:list | grep network
```

Deve aparecer:
```
GET|HEAD  api/v1/network/members ..... NetworkController@tree
GET|HEAD  api/v1/network/tree ....... NetworkController@tree
```

---

## 🔧 Configurar Deploy Automático (Recomendado)

### Opção 1: GitHub Actions (se usar GitHub)

1. Adicione secrets no repositório:
   - `HOST`: IP do servidor
   - `USERNAME`: usuário SSH (ex: root)
   - `SSH_KEY`: chave privada SSH
   - `PORT`: porta SSH (opcional, padrão 22)

2. O arquivo `.github/workflows/deploy.yml` já está criado!

3. Após push, o deploy será automático.

### Opção 2: Git Hook Local (no servidor)

```bash
cd /app/.git/hooks
cat > post-merge << 'EOF'
#!/bin/bash
cd /app
bash deploy.sh
EOF
chmod +x post-merge
```

Agora, sempre que fizer `git pull` no servidor, o script roda automaticamente.

### Opção 3: Cron de Deploy

```bash
# Adicionar ao crontab
crontab -e

# Adicionar esta linha (verifica a cada 5 minutos)
*/5 * * * * cd /app && git fetch && [ $(git rev-parse HEAD) != $(git rev-parse @{u}) ] && bash deploy.sh >> /var/log/auto-deploy.log 2>&1
```

---

## ⚠️ Importante

**Sempre limpe os caches após cada deploy!** A rota `/network/members` já existe no código, mas o Laravel usa cache de rotas que precisa ser limpo.

