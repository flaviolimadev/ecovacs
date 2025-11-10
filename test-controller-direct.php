<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== TESTANDO CONTROLLER DIRETAMENTE ===\n\n";

// Simular autenticação
$user = App\Models\User::where('email', 'admin@ecovacs.com')->first();

if (!$user) {
    echo "❌ Usuário não encontrado!\n";
    exit(1);
}

echo "✅ Usuário encontrado no banco:\n";
echo "ID: {$user->id}\n";
echo "Email: {$user->email}\n";
echo "Role no Eloquent: " . var_export($user->role, true) . "\n";

echo "\n=== SIMULANDO RESPOSTA DO LOGIN ===\n";

$token = $user->createToken('test_token')->plainTextToken;

$response = [
    'message' => 'Login realizado com sucesso!',
    'data' => [
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role ?? 'user',
            'referral_code' => $user->referral_code,
            'balance' => (float) $user->balance,
            'balance_withdrawn' => (float) $user->balance_withdrawn,
            'total_invested' => (float) $user->total_invested,
            'total_earned' => (float) $user->total_earned,
        ],
        'token' => $token,
    ],
];

echo "\nJSON que seria retornado:\n";
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

echo "\n\n=== VERIFICAÇÃO FINAL ===\n";
if (isset($response['data']['user']['role']) && $response['data']['user']['role'] === 'admin') {
    echo "✅ Role está correto: admin\n";
} else {
    echo "❌ Role não está correto: " . ($response['data']['user']['role'] ?? 'undefined') . "\n";
}

