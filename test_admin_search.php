#!/usr/bin/env php
<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "=== Teste de Busca Admin ===\n\n";

// Buscar usuários com diferentes termos
$searchTerms = ['admin', 'test', 'joao', '@', '.com'];

foreach ($searchTerms as $term) {
    echo "Buscando por: '{$term}'\n";
    
    $users = User::where(function ($q) use ($term) {
        $q->where('name', 'ilike', "%{$term}%")
          ->orWhere('email', 'ilike', "%{$term}%")
          ->orWhere('referral_code', 'ilike', "%{$term}%");
    })->get();
    
    echo "Encontrados: " . $users->count() . " usuários\n";
    
    if ($users->count() > 0) {
        foreach ($users as $user) {
            echo "  - ID: {$user->id}, Nome: {$user->name}, Email: {$user->email}\n";
        }
    }
    
    echo "\n";
}

// Testar SQL gerado
echo "=== SQL gerado ===\n";
$query = User::where(function ($q) {
    $q->where('name', 'ilike', '%admin%')
      ->orWhere('email', 'ilike', '%admin%')
      ->orWhere('referral_code', 'ilike', '%admin%');
});

echo $query->toSql() . "\n";
echo "Bindings: " . json_encode($query->getBindings()) . "\n";

