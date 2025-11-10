<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateAdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Criar usuário admin padrão
        $admin = User::firstOrCreate(
            ['email' => 'admin@ecovacs.com'],
            [
                'name' => 'Administrador',
                'email' => 'admin@ecovacs.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'referral_code' => 'ADMIN-' . strtoupper(Str::random(6)),
                'balance' => 0,
                'balance_withdrawn' => 0,
                'total_invested' => 0,
                'total_earned' => 0,
                'total_withdrawn' => 0,
            ]
        );

        if ($admin->wasRecentlyCreated) {
            $this->command->info('✅ Usuário admin criado com sucesso!');
            $this->command->info('   Email: admin@ecovacs.com');
            $this->command->info('   Senha: admin123');
            $this->command->warn('   ⚠️  ALTERE A SENHA EM PRODUÇÃO!');
        } else {
            // Atualizar para admin se já existir
            if ($admin->role !== 'admin') {
                $admin->update(['role' => 'admin']);
                $this->command->info('✅ Usuário existente promovido a admin!');
            } else {
                $this->command->info('ℹ️  Usuário admin já existe.');
            }
        }
    }
}

