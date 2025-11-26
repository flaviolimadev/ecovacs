<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;
use Illuminate\Support\Facades\DB;

class NewGoldPlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 🗑️ DELETAR TODOS OS PLANOS ANTIGOS
        DB::statement('SET CONSTRAINTS ALL DEFERRED');
        Plan::truncate();
        
        $this->command->warn('🗑️  Todos os planos antigos foram deletados!');
        
        // ✨ CRIAR NOVOS PLANOS - TEMA MINERAÇÃO DE OURO
        $goldPlans = [
            [
                'name' => '⛏️ Carregadeira Subterrânea',
                'image' => '/assets/Carregadeira-subterranea.jpeg',
                'price' => 30.00,
                'daily_income' => 15.00,
                'duration_days' => 3,
                'total_return' => 45.00,
                'max_purchases' => 5,
                'type' => 'DAILY',
                'description' => 'Equipamento essencial para extração inicial de minério',
                'is_active' => true,
                'order' => 1,
            ],
            [
                'name' => '🔩 Perfuração de Poços',
                'image' => '/assets/Maquinaade-perfuracao-de-pocos..jpeg',
                'price' => 85.00,
                'daily_income' => 35.00,
                'duration_days' => 3,
                'total_return' => 105.00,
                'max_purchases' => 5,
                'type' => 'DAILY',
                'description' => 'Máquina especializada em perfuração profunda',
                'is_active' => true,
                'order' => 2,
            ],
            [
                'name' => '🚛 Caminhão de Mineração',
                'image' => '/assets/caminhao-de-mineracao-subterranea..jpeg',
                'price' => 150.00,
                'daily_income' => 38.00,
                'duration_days' => 5,
                'total_return' => 190.00,
                'max_purchases' => 4,
                'type' => 'DAILY',
                'description' => 'Transporte robusto para grandes volumes de minério',
                'is_active' => true,
                'order' => 3,
            ],
            [
                'name' => '⚡ Perfuratriz Jumbo',
                'image' => '/assets/Perfuratriz-jumbo.jpeg',
                'price' => 300.00,
                'daily_income' => 55.00,
                'duration_days' => 7,
                'total_return' => 385.00,
                'max_purchases' => 3,
                'type' => 'DAILY',
                'description' => 'Equipamento de alto desempenho para perfuração',
                'is_active' => true,
                'order' => 4,
            ],
            [
                'name' => '🏗️ Mineração Contínua',
                'image' => '/assets/Maquina-de-mineracao-continua.jpeg',
                'price' => 650.00,
                'daily_income' => 80.00,
                'duration_days' => 10,
                'total_return' => 800.00,
                'max_purchases' => 2,
                'type' => 'DAILY',
                'description' => 'Sistema automatizado de extração contínua',
                'is_active' => true,
                'order' => 5,
            ],
            [
                'name' => '⚙️ Moinho de Bolas Premium',
                'image' => '/assets/Moinho-de-bolas.jpeg',
                'price' => 1500.00,
                'daily_income' => 200.00,
                'duration_days' => 15,
                'total_return' => 3000.00,
                'max_purchases' => 1,
                'type' => 'DAILY',
                'description' => 'Tecnologia de ponta para processamento de ouro',
                'is_active' => true,
                'order' => 6,
            ],
        ];

        // Inserir os novos planos
        foreach ($goldPlans as $plan) {
            Plan::create($plan);
        }

        $this->command->info('✅ 6 novos planos de mineração criados com sucesso!');
        $this->command->info('💰 Todos os planos são do tipo DAILY (rendimento diário)');
        $this->command->info('🏆 Total de planos ativos: ' . Plan::count());
        
        // Mostrar resumo
        $this->command->newLine();
        $this->command->info('📋 RESUMO DOS NOVOS PLANOS:');
        foreach ($goldPlans as $index => $plan) {
            $this->command->line(sprintf(
                '%d. %s - R$ %.2f → R$ %.2f/dia × %d dias = R$ %.2f',
                $index + 1,
                $plan['name'],
                $plan['price'],
                $plan['daily_income'],
                $plan['duration_days'],
                $plan['total_return']
            ));
        }
    }
}

