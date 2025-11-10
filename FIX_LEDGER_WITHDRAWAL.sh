#!/bin/bash

# Script para corrigir o erro do Ledger no saque
# Erro: null value in column "type" of relation "ledger"

echo "=========================================="
echo "🔧 CORRIGINDO ERRO DO LEDGER NO SAQUE"
echo "=========================================="
echo ""

cd /app

echo "1. Fazendo backup do controller..."
cp app/Http/Controllers/API/V1/WithdrawController.php app/Http/Controllers/API/V1/WithdrawController.php.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup criado!"
echo ""

echo "2. Aplicando correção..."
# Corrigir o bloco do Ledger::create no método store()
sed -i "s/'ref_type' => 'WITHDRAW'/'type' => 'WITHDRAWAL'/g" app/Http/Controllers/API/V1/WithdrawController.php
sed -i "s/'ref_id' => \$withdrawal->id/'reference_type' => Withdrawal::class,\n                'reference_id' => \$withdrawal->id/g" app/Http/Controllers/API/V1/WithdrawController.php
sed -i "s/'amount' => -\$amount/'amount' => \$amount,\n                'operation' => 'DEBIT',\n                'balance_type' => 'balance_withdrawn'/g" app/Http/Controllers/API/V1/WithdrawController.php

echo "✓ Correção aplicada!"
echo ""

echo "3. Verificando correção..."
echo "Deve mostrar: 'type' => 'WITHDRAWAL'"
grep -A 10 "Registrar no ledger" app/Http/Controllers/API/V1/WithdrawController.php | grep "type"
echo ""

echo "4. Limpando caches..."
php artisan optimize:clear
composer dump-autoload -o
echo "✓ Caches limpos!"
echo ""

echo "=========================================="
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Teste fazer um saque pelo app"
echo "2. Se der erro, verifique os logs:"
echo "   grep ERROR storage/logs/laravel.log | tail -5"
echo ""

