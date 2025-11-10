<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

echo "=== SIMULANDO REQUISIÇÃO DE LOGIN ===\n\n";

// Criar request simulado
$request = Illuminate\Http\Request::create(
    '/api/v1/auth/login',
    'POST',
    [
        'email' => 'admin@ecovacs.com',
        'password' => 'admin123',
    ],
    [], // cookies
    [], // files
    ['CONTENT_TYPE' => 'application/json']
);

try {
    $response = $kernel->handle($request);
    
    echo "Status Code: " . $response->getStatusCode() . "\n";
    echo "\nResponse Body:\n";
    echo $response->getContent();
    echo "\n\n";
    
    $data = json_decode($response->getContent(), true);
    
    if (isset($data['data']['user']['role'])) {
        echo "✅ Role encontrado: " . $data['data']['user']['role'] . "\n";
    } else {
        echo "❌ Role não encontrado na resposta!\n";
        echo "\nUsuário retornado:\n";
        print_r($data['data']['user'] ?? []);
    }
    
} catch (\Exception $e) {
    echo "❌ ERRO: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}

$kernel->terminate($request, $response);

