<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Chamar seeders personalizados
        $this->call([
            AdminUserSeeder::class,
            // PlansSeeder::class, // ❌ DESABILITADO - Não modificar planos no deploy
        ]);
    }
}
