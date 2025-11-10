<?php
// Script temporário para limpar OPcache
// APAGUE ESTE ARQUIVO DEPOIS!

if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "✅ OPcache limpo com sucesso!\n";
} else {
    echo "❌ OPcache não está habilitado\n";
}

if (function_exists('apcu_clear_cache')) {
    apcu_clear_cache();
    echo "✅ APCu limpo com sucesso!\n";
}

echo "\n🔄 Agora tente fazer login novamente!";
echo "\n\n⚠️  LEMBRE-SE DE APAGAR ESTE ARQUIVO: public/clear-opcache.php";

