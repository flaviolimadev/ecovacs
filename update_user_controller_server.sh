#!/bin/bash
# Script para atualizar UserController no servidor

cd /app

# 1. Fazer backup
echo "1. Fazendo backup do arquivo atual..."
cp app/Http/Controllers/API/V1/Admin/UserController.php app/Http/Controllers/API/V1/Admin/UserController.php.backup_$(date +%Y%m%d_%H%M%S)

# 2. Verificar tamanho atual
echo ""
echo "2. Tamanho do arquivo atual:"
wc -l app/Http/Controllers/API/V1/Admin/UserController.php

# 3. Baixar versão atualizada do GitHub
echo ""
echo "3. Baixando versão atualizada..."
curl -s -o app/Http/Controllers/API/V1/Admin/UserController.php \
  https://raw.githubusercontent.com/flaviolimadev/ecovacs/main/app/Http/Controllers/API/V1/Admin/UserController.php

# 4. Verificar novo tamanho
echo ""
echo "4. Tamanho do arquivo atualizado:"
wc -l app/Http/Controllers/API/V1/Admin/UserController.php

# 5. Verificar se tem o método getReferralNetwork
echo ""
echo "5. Verificando se método getReferralNetwork existe:"
grep -c "getReferralNetwork" app/Http/Controllers/API/V1/Admin/UserController.php

# 6. Limpar caches
echo ""
echo "6. Limpando caches..."
php artisan optimize:clear
composer dump-autoload -o

# 7. Testar estrutura
echo ""
echo "7. Testando estrutura retornada:"
php artisan tinker --execute="
\$controller = new App\Http\Controllers\API\V1\Admin\UserController();
try {
    \$response = \$controller->show(1);
    \$data = \$response->getData();
    echo '- user: ' . (isset(\$data->data->user) ? '✅ OK' : '❌ FALTA') . PHP_EOL;
    echo '- cycles: ' . (isset(\$data->data->cycles) ? '✅ OK' : '❌ FALTA') . PHP_EOL;
    echo '- ledger: ' . (isset(\$data->data->ledger) ? '✅ OK' : '❌ FALTA') . PHP_EOL;
    echo '- referral_network: ' . (isset(\$data->data->referral_network) ? '✅ OK' : '❌ FALTA') . PHP_EOL;
} catch (\Exception \$e) {
    echo '❌ ERRO: ' . \$e->getMessage();
}
"

echo ""
echo "✅ Atualização concluída!"

