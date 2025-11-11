#!/bin/bash
# Quick Fix - Resolve problemas comuns automaticamente

echo "=========================================="
echo "  🔧 QUICK FIX - Correção Rápida"
echo "=========================================="
echo ""

cd /app

echo "🔍 Diagnosticando problemas..."
echo ""

# Fix 1: WithdrawController
WITHDRAW_ISSUE=$(grep -c "balance_type" app/Http/Controllers/API/V1/WithdrawController.php)
if [ "$WITHDRAW_ISSUE" -eq 0 ]; then
    echo "❌ Problema detectado: WithdrawController"
    echo "   Aplicando correção..."
    cp app/Http/Controllers/API/V1/WithdrawController.php app/Http/Controllers/API/V1/WithdrawController.php.BAK
    curl -s -o app/Http/Controllers/API/V1/WithdrawController.php \
      https://raw.githubusercontent.com/flaviolimadev/ecovacs/main/app/Http/Controllers/API/V1/WithdrawController.php
    echo "   ✅ WithdrawController corrigido"
else
    echo "✅ WithdrawController OK"
fi

# Fix 2: DepositController
DEPOSIT_ISSUE=$(grep -c "addDays(2)" app/Http/Controllers/API/V1/DepositController.php)
if [ "$DEPOSIT_ISSUE" -eq 0 ]; then
    echo "❌ Problema detectado: DepositController"
    echo "   Aplicando correção..."
    sed -i "s/now()->addDay()->toDateString()/now()->addDays(2)->toDateString()/g" \
      app/Http/Controllers/API/V1/DepositController.php
    echo "   ✅ DepositController corrigido"
else
    echo "✅ DepositController OK"
fi

echo ""
echo "🧹 Limpando caches..."
php artisan optimize:clear > /dev/null 2>&1
composer dump-autoload -o > /dev/null 2>&1
php artisan config:cache > /dev/null 2>&1
php artisan route:cache > /dev/null 2>&1
echo "✅ Caches limpos"

echo ""
echo "=========================================="
echo "  ✅ CORREÇÕES APLICADAS!"
echo "=========================================="
echo ""
echo "🧪 Agora você pode testar:"
echo "   • Fazer um depósito"
echo "   • Fazer um saque"
echo ""

