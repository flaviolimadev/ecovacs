#!/bin/bash

echo "=========================================="
echo "  🔍 VERIFICAÇÃO PÓS-DEPLOY"
echo "=========================================="
echo ""

cd /app

ALL_OK=true

echo "1️⃣  Verificando WithdrawController..."
WITHDRAW_CHECK=$(grep -c "balance_type" app/Http/Controllers/API/V1/WithdrawController.php)
if [ "$WITHDRAW_CHECK" -ge "1" ]; then
    echo "   ✅ WithdrawController OK (balance_type encontrado ${WITHDRAW_CHECK}x)"
else
    echo "   ❌ WithdrawController ERRO (balance_type não encontrado)"
    ALL_OK=false
fi
echo ""

echo "2️⃣  Verificando DepositController..."
DEPOSIT_CHECK=$(grep -c "addDays(2)" app/Http/Controllers/API/V1/DepositController.php)
if [ "$DEPOSIT_CHECK" -ge "1" ]; then
    echo "   ✅ DepositController OK (addDays(2) encontrado)"
else
    echo "   ❌ DepositController ERRO (addDays(2) não encontrado)"
    echo "   Tentando corrigir automaticamente..."
    sed -i "s/now()->addDay()->toDateString()/now()->addDays(2)->toDateString()/g" app/Http/Controllers/API/V1/DepositController.php
    php artisan optimize:clear
    echo "   ✅ Correção aplicada"
fi
echo ""

echo "3️⃣  Verificando conexão com banco de dados..."
php artisan tinker --execute="DB::connection()->getPdo(); echo 'Conexão OK';" 2>&1 | grep -q "Conexão OK"
if [ $? -eq 0 ]; then
    echo "   ✅ Banco de dados OK"
else
    echo "   ❌ Erro na conexão com banco de dados"
    ALL_OK=false
fi
echo ""

echo "4️⃣  Verificando tabelas críticas..."
TABLES=("users" "cycles" "earnings" "ledger" "withdrawals" "deposits" "settings")
for table in "${TABLES[@]}"; do
    php artisan tinker --execute="DB::table('$table')->count();" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Tabela '$table' OK"
    else
        echo "   ❌ Tabela '$table' não encontrada"
        ALL_OK=false
    fi
done
echo ""

echo "5️⃣  Verificando permissões..."
if [ -w storage/logs ]; then
    echo "   ✅ Permissões de escrita OK"
else
    echo "   ❌ Sem permissão de escrita em storage/logs"
    ALL_OK=false
fi
echo ""

echo "6️⃣  Verificando últimos erros no log..."
if [ -f storage/logs/laravel.log ]; then
    ERRORS=$(grep -c "ERROR" storage/logs/laravel.log | tail -100)
    RECENT_WITHDRAW_ERRORS=$(grep "Erro ao processar saque" storage/logs/laravel.log | tail -5 | wc -l)
    
    if [ "$RECENT_WITHDRAW_ERRORS" -gt 0 ]; then
        echo "   ⚠️  $RECENT_WITHDRAW_ERRORS erros recentes de saque encontrados:"
        grep "Erro ao processar saque" storage/logs/laravel.log | tail -2
    else
        echo "   ✅ Nenhum erro recente de saque"
    fi
else
    echo "   ⚠️  Log não encontrado (pode ser primeira execução)"
fi
echo ""

echo "=========================================="
if [ "$ALL_OK" = true ]; then
    echo "  ✅ TODOS OS CHECKS PASSARAM!"
else
    echo "  ⚠️  ALGUNS CHECKS FALHARAM"
fi
echo "=========================================="
echo ""

