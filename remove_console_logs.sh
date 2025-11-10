#!/bin/bash

echo "🧹 Removendo todos os console.log, console.warn, console.error e console.info da aplicação..."
echo ""

# Lista de arquivos para processar
files=(
  "resources/js/pages/admin/AdminWithdrawals.tsx"
  "resources/js/pages/admin/AdminUsers.tsx"
  "resources/js/pages/admin/AdminSettings.tsx"
  "resources/js/contexts/AuthContext.tsx"
  "resources/js/components/AdminRoute.tsx"
  "resources/js/pages/Withdraw.tsx"
  "resources/js/pages/Deposit.tsx"
  "resources/js/components/MembersList.tsx"
  "resources/js/components/FeatureCards.tsx"
  "resources/js/components/ProductCard.tsx"
  "resources/js/components/ActionButtonsGrid.tsx"
  "resources/js/components/ProductsSection.tsx"
  "resources/js/pages/NotFound.tsx"
)

count=0

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Contar quantos console.* existem antes
    before=$(grep -c "console\." "$file" 2>/dev/null || echo "0")
    
    if [ "$before" -gt 0 ]; then
      echo "📝 Processando: $file ($before console.* encontrados)"
      
      # Remover linhas com console.log, console.warn, console.error, console.info
      sed -i '/console\.\(log\|warn\|error\|info\)/d' "$file"
      
      count=$((count + before))
    fi
  fi
done

echo ""
echo "✅ Total de linhas removidas: $count"
echo ""
echo "🔨 Agora execute: npm run build"

