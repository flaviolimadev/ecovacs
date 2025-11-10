<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== VERIFICANDO USUÁRIO admin@admin.com ===\n\n";

$user = \App\Models\User::where('email', 'admin@admin.com')->first();

if ($user) {
    echo "✅ Usuário encontrado!\n";
    echo "ID: {$user->id}\n";
    echo "Nome: {$user->name}\n";
    echo "Email: {$user->email}\n";
    echo "Role ATUAL: " . ($user->role ?? 'NULL/INDEFINIDO') . "\n\n";
    
    if ($user->role !== 'admin') {
        echo "❌ PROBLEMA: Role não é 'admin'!\n";
        echo "🔧 CORRIGINDO...\n";
        $user->role = 'admin';
        $user->save();
        echo "✅ CORRIGIDO! Role atualizado para: admin\n";
    } else {
        echo "✅ Role já é 'admin', está correto!\n";
    }
} else {
    echo "❌ Usuário admin@admin.com não encontrado!\n\n";
    echo "Usuários disponíveis:\n";
    $users = \App\Models\User::all(['id', 'email', 'role']);
    foreach ($users as $u) {
        $role = $u->role ?? 'NULL';
        echo "  - ID {$u->id}: {$u->email} (role: {$role})\n";
    }
}

echo "\n=== FIM DA VERIFICAÇÃO ===\n";

