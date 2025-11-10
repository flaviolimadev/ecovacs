<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== TESTANDO CAMPO ROLE ===\n\n";

$user = App\Models\User::find(6);

echo "ID: {$user->id}\n";
echo "Email: {$user->email}\n";
echo "Role (direto): " . var_export($user->role, true) . "\n";
echo "Role (getAttribute): " . var_export($user->getAttribute('role'), true) . "\n";
echo "\nTodos os attributes:\n";
print_r($user->getAttributes());

echo "\n\n=== TESTE DE LOGIN ===\n";
$loginResponse = [
    'id' => $user->id,
    'name' => $user->name,
    'email' => $user->email,
    'phone' => $user->phone,
    'role' => $user->role ?? 'user',
    'referral_code' => $user->referral_code,
];
echo "Resposta que seria enviada:\n";
print_r($loginResponse);

