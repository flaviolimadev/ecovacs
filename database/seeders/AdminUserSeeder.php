<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Verificar se o usuário admin já existe
        $existingAdmin = User::where('email', 'admin@admin.com')->first();
        
        if ($existingAdmin) {
            $this->command->warn('⚠️  Usuário admin@admin.com já existe!');
            $this->command->info('📧 Email: admin@admin.com');
            $this->command->info('🔑 Código de Indicação: ' . $existingAdmin->referral_code);
            return;
        }

        // Criar usuário admin
        $admin = User::create([
            'name' => 'Administrador',
            'email' => 'admin@admin.com',
            'phone' => '(00) 00000-0000',
            'password' => Hash::make('admin123'),
            'referral_code' => 'ADMIN001',
            'referred_by' => null, // Admin não tem indicador (é o usuário raiz)
            'balance' => 10000.00, // Saldo inicial de R$ 10.000,00 para testes
            'balance_withdrawn' => 5000.00, // Saldo disponível para saque de R$ 5.000,00
            'total_invested' => 5000.00,
            'total_earned' => 5000.00,
            'is_active' => true,
            'is_verified' => true,
        ]);

        $this->command->info('✅ Usuário administrador criado com sucesso!');
        $this->command->newLine();
        $this->command->info('═══════════════════════════════════════════════════');
        $this->command->info('📧 Email: admin@admin.com');
        $this->command->info('🔐 Senha: admin123');
        $this->command->info('🔑 Código de Indicação: ADMIN001');
        $this->command->info('💰 Saldo para Investir: R$ 10.000,00');
        $this->command->info('💵 Saldo para Saque: R$ 5.000,00');
        $this->command->info('═══════════════════════════════════════════════════');
        $this->command->newLine();
        $this->command->warn('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    }
}
