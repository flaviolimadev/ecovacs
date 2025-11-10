#!/bin/bash

echo "🔍 DIAGNÓSTICO DO ERRO DE SAQUE"
echo "================================"
echo ""

echo "1️⃣ Verificando código do WithdrawController..."
echo "---"
grep -A 10 "Registrar no ledger" app/Http/Controllers/API/V1/WithdrawController.php | head -15
echo ""

echo "2️⃣ Últimas 50 linhas do log do Laravel..."
echo "---"
tail -50 storage/logs/laravel.log
echo ""

echo "3️⃣ Verificando estrutura da tabela ledger..."
echo "---"
php artisan tinker --execute="
\$columns = DB::select('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'ledger\' ORDER BY ordinal_position');
foreach (\$columns as \$col) {
    echo \$col->column_name . ' (' . \$col->data_type . ')' . PHP_EOL;
}
"
echo ""

echo "4️⃣ Testando criação de registro no ledger..."
echo "---"
php artisan tinker --execute="
try {
    \$testData = [
        'user_id' => 1,
        'type' => 'TEST',
        'reference_type' => 'TEST',
        'reference_id' => 1,
        'description' => 'Teste',
        'amount' => 10.00,
        'operation' => 'CREDIT',
    ];
    echo 'Tentando criar registro com: ' . json_encode(\$testData) . PHP_EOL;
    \$ledger = \App\Models\Ledger::create(\$testData);
    echo '✅ Sucesso! ID: ' . \$ledger->id . PHP_EOL;
    \$ledger->delete();
} catch (\Exception \$e) {
    echo '❌ Erro: ' . \$e->getMessage() . PHP_EOL;
}
"
echo ""

echo "✅ Diagnóstico completo!"

