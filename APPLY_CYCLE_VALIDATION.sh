#!/bin/bash
# Script para adicionar validação de ciclo finalizado nos saques

echo "=== ADICIONANDO VALIDAÇÃO DE CICLO FINALIZADO ==="

cd /app

# 1. Adicionar import do Model Cycle
sed -i 's/use App\\Models\\Ledger;/use App\\Models\\Ledger;\nuse App\\Models\\Cycle;/g' app/Http/Controllers/API/V1/WithdrawController.php

# 2. Adicionar validação de ciclo logo no início do método store()
# Procurar por "try {" e inserir validação após ele
sed -i '/try {/a\            \/\/ 1. Validar se o usuário tem pelo menos 1 ciclo finalizado\n            $finishedCyclesCount = Cycle::where("user_id", $user->id)\n                ->where("status", "FINISHED")\n                ->count();\n\n            if ($finishedCyclesCount < 1) {\n                return response()->json([\n                    "error" => [\n                        "code" => "NO_FINISHED_CYCLES",\n                        "message" => "Você precisa ter pelo menos 1 ciclo finalizado para realizar saques.",\n                        "details" => [\n                            "finished_cycles" => $finishedCyclesCount,\n                            "required_cycles" => 1,\n                        ]\n                    ]\n                ], 400);\n            }\n' app/Http/Controllers/API/V1/WithdrawController.php

# 3. Renumerar comentários (1 -> 2, 2 -> 3, etc.)
sed -i 's/\/\/ 1\. Validar janela de saque/\/\/ 2. Validar janela de saque/g' app/Http/Controllers/API/V1/WithdrawController.php
sed -i 's/\/\/ 2\. Validar limite diário/\/\/ 3. Validar limite diário/g' app/Http/Controllers/API/V1/WithdrawController.php
sed -i 's/\/\/ 3\. Validar valor mínimo/\/\/ 4. Validar valor mínimo/g' app/Http/Controllers/API/V1/WithdrawController.php
sed -i 's/\/\/ 4\. Calcular taxa e valor líquido/\/\/ 5. Calcular taxa e valor líquido/g' app/Http/Controllers/API/V1/WithdrawController.php
sed -i 's/\/\/ 5\. Validar saldo disponível/\/\/ 6. Validar saldo disponível/g' app/Http/Controllers/API/V1/WithdrawController.php
sed -i 's/\/\/ 6\. Validar chave PIX/\/\/ 7. Validar chave PIX/g' app/Http/Controllers/API/V1/WithdrawController.php
sed -i 's/\/\/ 7\. Criar registro de saque/\/\/ 8. Criar registro de saque/g' app/Http/Controllers/API/V1/WithdrawController.php
sed -i 's/\/\/ 8\. Debitar saldo do usuário/\/\/ 9. Debitar saldo do usuário/g' app/Http/Controllers/API/V1/WithdrawController.php
sed -i 's/\/\/ 9\. Registrar no ledger/\/\/ 10. Registrar no ledger/g' app/Http/Controllers/API/V1/WithdrawController.php
sed -i 's/\/\/ 10\. Processar automaticamente/\/\/ 11. Processar automaticamente/g' app/Http/Controllers/API/V1/WithdrawController.php

# 4. Limpar caches
echo ""
echo "=== LIMPANDO CACHES ==="
php artisan optimize:clear
composer dump-autoload -o

# 5. Verificar resultado
echo ""
echo "=== VERIFICANDO IMPORT DO CYCLE ==="
grep -n "use App\\\\Models\\\\Cycle" app/Http/Controllers/API/V1/WithdrawController.php

echo ""
echo "=== VERIFICANDO VALIDAÇÃO (primeiras linhas após try) ==="
grep -A 15 "try {" app/Http/Controllers/API/V1/WithdrawController.php | head -20

echo ""
echo "✅ VALIDAÇÃO DE CICLO ADICIONADA!"
echo "Agora apenas usuários com pelo menos 1 ciclo FINISHED podem sacar."

