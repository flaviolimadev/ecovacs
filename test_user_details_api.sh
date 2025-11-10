#!/bin/bash
# Script para testar a API de detalhes do usuário

cd /app

echo "=== TESTANDO API DE DETALHES DO USUÁRIO ==="
echo ""

# 1. Fazer login e pegar token
echo "1. Fazendo login..."
TOKEN=$(php artisan tinker --execute="
\$user = App\Models\User::where('email', 'admin@admin.com')->first();
if (!\$user) {
    echo 'Usuário admin não encontrado';
    exit(1);
}
\$token = \$user->createToken('test')->plainTextToken;
echo \$token;
")

if [ -z "$TOKEN" ]; then
    echo "❌ Erro ao obter token"
    exit 1
fi

echo "✅ Token obtido"
echo ""

# 2. Testar endpoint de detalhes
echo "2. Testando GET /api/v1/admin/users/1"
echo ""

curl -s -X GET "http://localhost/api/v1/admin/users/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  | jq . || cat

echo ""
echo ""

# 3. Verificar logs de erro
echo "3. Verificando logs de erro recentes..."
echo ""
tail -20 storage/logs/laravel.log | grep -A 10 "ERROR" || echo "✅ Sem erros no log"

echo ""
echo "=== FIM DO TESTE ==="

