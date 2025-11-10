<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Adicionando campo role...\n";
DB::statement("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'user'");
echo "Campo adicionado!\n";

echo "Atualizando admin...\n";
$admin = App\Models\User::find(6);
if ($admin) {
    $admin->role = 'admin';
    $admin->save();
    echo "Admin atualizado! Email: {$admin->email}, Role: {$admin->role}\n";
}

echo "Usuarios:\n";
foreach (App\Models\User::all() as $u) {
    echo "ID {$u->id}: {$u->email} - Role: " . ($u->role ?: 'NULL') . "\n";
}

