<?php

/**
 * Script de emergência para adicionar campo ROLE na tabela USERS
 * Execute: php fix-role-now.php
 */

echo "========================================\n";
echo "🔧 CORRIGINDO PROBLEMA DO CAMPO ROLE\n";
echo "========================================\n\n";

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    echo "1️⃣ Verificando se a coluna 'role' existe...\n";
    
    $hasRole = \Illuminate\Support\Facades\Schema::hasColumn('users', 'role');
    
    if ($hasRole) {
        echo "✅ Coluna 'role' já existe!\n\n";
    } else {
        echo "❌ Coluna 'role' NÃO existe!\n";
        echo "🔧 Adicionando coluna...\n";
        
        \Illuminate\Support\Facades\DB::statement(
            "ALTER TABLE users ADD COLUMN role VARCHAR(255) DEFAULT 'user'"
        );
        
        echo "✅ Coluna 'role' adicionada com sucesso!\n\n";
    }
    
    echo "2️⃣ Atualizando usuários admin...\n";
    
    // Atualizar admin@ecovacs.com
    $admin1 = \App\Models\User::where('email', 'admin@ecovacs.com')->first();
    if ($admin1) {
        $admin1->role = 'admin';
        $admin1->save();
        echo "✅ admin@ecovacs.com atualizado! (ID: {$admin1->id})\n";
    } else {
        echo "⚠️  admin@ecovacs.com não encontrado\n";
    }
    
    // Atualizar admin@admin.com
    $admin2 = \App\Models\User::where('email', 'admin@admin.com')->first();
    if ($admin2) {
        $admin2->role = 'admin';
        $admin2->save();
        echo "✅ admin@admin.com atualizado! (ID: {$admin2->id})\n";
    } else {
        echo "⚠️  admin@admin.com não encontrado\n";
    }
    
    echo "\n3️⃣ Verificando todos os usuários:\n";
    echo "-------------------------------------\n";
    
    $users = \App\Models\User::all(['id', 'email', 'role']);
    foreach ($users as $user) {
        $roleDisplay = $user->role ?: 'NULL';
        $icon = $user->role === 'admin' ? '🔐' : '👤';
        echo "{$icon} ID {$user->id}: {$user->email} (role: {$roleDisplay})\n";
    }
    
    echo "\n========================================\n";
    echo "✅ CORREÇÃO CONCLUÍDA COM SUCESSO!\n";
    echo "========================================\n\n";
    
    echo "📋 PRÓXIMOS PASSOS:\n";
    echo "1. Faça logout no navegador\n";
    echo "2. Limpe o cache (Ctrl+Shift+Delete)\n";
    echo "3. Faça login novamente\n";
    echo "4. Acesse /admin/users\n\n";
    
} catch (\Exception $e) {
    echo "\n❌ ERRO: " . $e->getMessage() . "\n";
    echo "\n📝 Stacktrace:\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}

