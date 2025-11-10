# 📋 Como Verificar Logs de Erro

## 🚀 Comandos Rápidos (Copie e Cole)

### 1️⃣ Ver Últimos Erros em Tempo Real
```bash
cd /app
tail -f storage/logs/laravel.log
```
**Pressione `Ctrl+C` para parar**

---

### 2️⃣ Ver Últimas 50 Linhas do Log
```bash
cd /app
tail -50 storage/logs/laravel.log
```

---

### 3️⃣ Ver Últimas 100 Linhas do Log
```bash
cd /app
tail -100 storage/logs/laravel.log
```

---

### 4️⃣ Filtrar Apenas ERROS
```bash
cd /app
grep "ERROR" storage/logs/laravel.log | tail -20
```

---

### 5️⃣ Filtrar Erros de SAQUE
```bash
cd /app
grep -i "saque\|withdrawal" storage/logs/laravel.log | tail -20
```

---

### 6️⃣ Filtrar Erros de USUÁRIO/ADMIN
```bash
cd /app
grep -i "user\|admin" storage/logs/laravel.log | tail -20
```

---

### 7️⃣ Ver Erros de HOJE
```bash
cd /app
grep "$(date +%Y-%m-%d)" storage/logs/laravel.log | grep "ERROR"
```

---

### 8️⃣ Ver Último Erro Completo (com Stack Trace)
```bash
cd /app
tail -200 storage/logs/laravel.log | grep -A 50 "ERROR"
```

---

## 📊 Comandos Avançados

### Ver Erros por Tipo

#### Erros de Banco de Dados (SQL)
```bash
grep "SQLSTATE\|QueryException" storage/logs/laravel.log | tail -20
```

#### Erros 500 (Internal Server Error)
```bash
grep "500\|INTERNAL_ERROR" storage/logs/laravel.log | tail -20
```

#### Erros de Validação
```bash
grep "ValidationException" storage/logs/laravel.log | tail -20
```

#### Erros da API Vizzion
```bash
grep "Vizzion" storage/logs/laravel.log | tail -20
```

---

## 🔍 Buscar Erro Específico

### Por Mensagem de Erro
```bash
cd /app
grep "mensagem do erro" storage/logs/laravel.log
```

**Exemplo:**
```bash
grep "Saldo insuficiente" storage/logs/laravel.log
```

### Por ID de Usuário
```bash
grep "user_id.*1" storage/logs/laravel.log | tail -20
```

### Por ID de Saque
```bash
grep "withdrawal_id.*5" storage/logs/laravel.log | tail -20
```

---

## 📁 Localização dos Logs

### Laravel Log (Principal)
```bash
/app/storage/logs/laravel.log
```

### Logs do Servidor (Nginx/Apache)
```bash
# Nginx
/var/log/nginx/error.log
tail -50 /var/log/nginx/error.log

# Apache
/var/log/apache2/error.log
tail -50 /var/log/apache2/error.log
```

### Logs do PHP
```bash
/var/log/php8.2-fpm.log
tail -50 /var/log/php8.2-fpm.log
```

---

## 🧹 Limpar Logs (USE COM CUIDADO!)

### Ver Tamanho do Log Atual
```bash
cd /app
ls -lh storage/logs/laravel.log
```

### Limpar Log (Esvaziar Arquivo)
```bash
cd /app
# Backup primeiro!
cp storage/logs/laravel.log storage/logs/laravel.log.backup

# Limpar
> storage/logs/laravel.log

# OU usar o comando Laravel
php artisan log:clear
```

---

## 💾 Baixar Logs para o seu Computador

### Via SCP (do seu computador local)
```bash
# Sintaxe
scp root@seu-servidor:/app/storage/logs/laravel.log ./laravel.log

# Exemplo
scp root@eco-vacs.store:/app/storage/logs/laravel.log ./laravel.log
```

### Via Cat + Copiar
```bash
cd /app
cat storage/logs/laravel.log
```
**Depois copie o output e cole num arquivo de texto local**

---

## 📝 Estrutura de um Log do Laravel

```
[2025-11-10 12:34:56] production.ERROR: Mensagem do erro
{
    "user_id": 1,
    "amount": 50,
    "error": "Descrição detalhada"
}
Stack trace:
#0 /app/app/Http/Controllers/...
#1 /app/vendor/laravel/framework/...
...
```

### Partes Importantes:
- **[Data e Hora]** - Quando aconteceu
- **production.ERROR** - Ambiente e nível (ERROR, WARNING, INFO)
- **Mensagem** - Descrição do erro
- **JSON** - Dados contextuais (user_id, valores, etc)
- **Stack trace** - Onde aconteceu no código (arquivo:linha)

---

## 🎯 Comandos Úteis para Diagnóstico

### 1. Ver Estatísticas de Erros
```bash
cd /app
# Contar quantos erros há
grep -c "ERROR" storage/logs/laravel.log

# Contar por tipo
grep "ERROR" storage/logs/laravel.log | cut -d':' -f4 | sort | uniq -c | sort -rn
```

### 2. Ver Erros Únicos (Sem Repetição)
```bash
cd /app
grep "ERROR" storage/logs/laravel.log | cut -d':' -f4-5 | sort -u
```

### 3. Monitorar em Tempo Real COM Filtro
```bash
cd /app
# Ver apenas erros em tempo real
tail -f storage/logs/laravel.log | grep --line-buffered "ERROR"

# Ver apenas saques em tempo real
tail -f storage/logs/laravel.log | grep --line-buffered -i "saque"
```

---

## 🐛 Exemplo de Uso - Debugar Erro de Saque

```bash
# 1. Conectar no servidor
ssh root@eco-vacs.store

# 2. Ir para o diretório do app
cd /app

# 3. Ver últimos erros de saque
grep -i "saque\|withdrawal" storage/logs/laravel.log | tail -30

# 4. Se encontrar erro, ver contexto completo
tail -200 storage/logs/laravel.log | grep -B 5 -A 30 "Erro ao processar saque"

# 5. Copiar o erro e compartilhar
```

---

## 🔧 Configurar Logging (Opcional)

### Ver Configuração Atual
```bash
cd /app
cat config/logging.php | grep -A 10 "channels"
```

### Aumentar Nível de Log (Temporário)
```bash
cd /app
# Editar .env
nano .env

# Mudar
LOG_LEVEL=error
# Para
LOG_LEVEL=debug

# Salvar (Ctrl+O, Enter, Ctrl+X)

# Limpar cache
php artisan config:clear
```

---

## 📞 Comandos de Emergência

### Sistema Travado? Ver Processos
```bash
top
# OU
htop
```

### Espaço em Disco Cheio?
```bash
df -h
```

### Log Muito Grande?
```bash
# Ver tamanho de todos os logs
du -h storage/logs/

# Ver os 10 maiores arquivos
du -ah storage/ | sort -rh | head -10
```

---

## ✅ Checklist de Diagnóstico

Quando houver erro, execute na ordem:

- [ ] `tail -50 storage/logs/laravel.log` - Ver últimos erros
- [ ] `grep "ERROR" storage/logs/laravel.log | tail -20` - Ver apenas erros
- [ ] `php test_withdrawal.php 1 50` - Testar funcionalidade
- [ ] `php artisan tinker` - Verificar dados no banco
- [ ] Copiar output dos comandos acima
- [ ] Compartilhar para análise

---

## 🎓 Dicas Pro

### 1. Criar Alias Úteis (Opcional)
```bash
# Adicionar ao ~/.bashrc
echo 'alias logs="tail -f /app/storage/logs/laravel.log"' >> ~/.bashrc
echo 'alias logerr="grep ERROR /app/storage/logs/laravel.log | tail -20"' >> ~/.bashrc
source ~/.bashrc

# Usar
logs      # Ver em tempo real
logerr    # Ver últimos erros
```

### 2. Usar `less` para Navegar
```bash
cd /app
less +G storage/logs/laravel.log
# Teclas:
# G - Ir para o final
# g - Ir para o início
# / - Buscar
# q - Sair
```

### 3. Exportar Erros de Hoje
```bash
cd /app
grep "$(date +%Y-%m-%d)" storage/logs/laravel.log > erros_hoje.txt
cat erros_hoje.txt
```

---

**Última atualização:** 10/11/2025

