<?php
// DEBUG: Verificar Model User em produção
// APAGUE ESTE ARQUIVO DEPOIS!

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

header('Content-Type: text/plain; charset=utf-8');

echo "=== DEBUG: MODEL USER EM PRODUÇÃO ===\n\n";

echo "1️⃣ Verificando Model User:\n";
echo "Caminho: " . (new ReflectionClass(App\Models\User::class))->getFileName() . "\n\n";

echo "2️⃣ Fillable do Model:\n";
$user = new App\Models\User();
print_r($user->getFillable());
echo "\n";

echo "3️⃣ Testando usuário admin@ecovacs.com:\n";
$admin = App\Models\User::where('email', 'admin@ecovacs.com')->first();
if ($admin) {
    echo "✅ Usuário encontrado!\n";
    echo "ID: {$admin->id}\n";
    echo "Email: {$admin->email}\n";
    echo "Role: " . var_export($admin->role, true) . "\n";
    echo "Role (getAttribute): " . var_export($admin->getAttribute('role'), true) . "\n\n";
    
    echo "4️⃣ Simulando resposta de login:\n";
    $response = [
        'id' => $admin->id,
        'name' => $admin->name,
        'email' => $admin->email,
        'phone' => $admin->phone,
        'role' => $admin->role ?? 'user',
        'referral_code' => $admin->referral_code,
    ];
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    echo "\n\n";
    
    if (isset($response['role']) && $response['role'] !== null) {
        echo "✅ Role está presente: {$response['role']}\n";
    } else {
        echo "❌ Role está NULL ou ausente!\n";
    }
} else {
    echo "❌ Usuário não encontrado!\n";
}

echo "\n5️⃣ Verificando coluna no banco:\n";
try {
    $hasColumn = Illuminate\Support\Facades\Schema::hasColumn('users', 'role');
    echo "Coluna 'role' existe? " . ($hasColumn ? 'SIM' : 'NÃO') . "\n";
    
    if ($hasColumn) {
        $result = DB::select("SELECT role FROM users WHERE email = 'admin@ecovacs.com' LIMIT 1");
        if ($result) {
            echo "Valor no banco: " . var_export($result[0]->role, true) . "\n";
        }
    }
} catch (\Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}

echo "\n⚠️  IMPORTANTE: Delete este arquivo após usar!\n";
echo "DELETE: public/debug-user-model.php\n";

