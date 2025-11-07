<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ⚠️ NÃO usar truncate() - apagaria todos os planos e ciclos ativos!
        // Usar firstOrCreate() para criar apenas se não existir
        
        // Planos Padrão (DAILY - Rendimento Diário)
        $standardPlans = [
            [
                'name' => '🤖 Ecovacs Deebot T8 Robot',
                'image' => '/assets/ecovacs-t8.jpg',
                'price' => 50.00,
                'daily_income' => 5.00,
                'duration_days' => 20,
                'total_return' => 100.00,
                'max_purchases' => 1,
                'type' => 'DAILY',
                'is_active' => true,
                'order' => 1,
            ],
            [
                'name' => '🤖 Ecovacs Deebot T80 Omni',
                'image' => '/assets/ecovacs-t80.jpg',
                'price' => 150.00,
                'daily_income' => 12.00,
                'duration_days' => 25,
                'total_return' => 300.00,
                'max_purchases' => 1,
                'type' => 'DAILY',
                'is_active' => true,
                'order' => 2,
            ],
            [
                'name' => '🤖 Ecovacs Deebot X8 Pro Omni',
                'image' => '/assets/ecovacs-t80.jpg',
                'price' => 300.00,
                'daily_income' => 30.00,
                'duration_days' => 22,
                'total_return' => 660.00,
                'max_purchases' => 1,
                'type' => 'DAILY',
                'is_active' => true,
                'order' => 3,
            ],
            [
                'name' => '🤖 Ecovacs Deebot N30 Omni',
                'image' => '/assets/ecovacs-n30.jpg',
                'price' => 600.00,
                'daily_income' => 43.00,
                'duration_days' => 30,
                'total_return' => 1290.00,
                'max_purchases' => 2,
                'type' => 'DAILY',
                'is_active' => true,
                'order' => 4,
            ],
            [
                'name' => '🤖 Ecovacs Deebot T20 Omni',
                'image' => '/assets/ecovacs-t20.jpg',
                'price' => 1200.00,
                'daily_income' => 85.00,
                'duration_days' => 30,
                'total_return' => 2550.00,
                'max_purchases' => 2,
                'type' => 'DAILY',
                'is_active' => true,
                'order' => 5,
            ],
            [
                'name' => '🤖 Ecovacs Deebot T50 Omni',
                'image' => '/assets/ecovacs-t50.jpg',
                'price' => 2500.00,
                'daily_income' => 187.50,
                'duration_days' => 32,
                'total_return' => 6000.00,
                'max_purchases' => 4,
                'type' => 'DAILY',
                'is_active' => true,
                'order' => 6,
            ],
        ];

        // Planos Ciclo (END_CYCLE - Lucro no Final)
        $cyclePlans = [
            [
                'name' => '🤖 Plano Ciclo 45 Dias',
                'image' => '/assets/ecovacs-t50.jpg',
                'price' => 500.00,
                'daily_income' => null, // Sem renda diária
                'duration_days' => 45,
                'total_return' => 2250.00,
                'max_purchases' => 0, // Ilimitado
                'type' => 'END_CYCLE',
                'description' => 'Lucro no final do ciclo + devolução do capital investido',
                'is_active' => true,
                'order' => 7,
            ],
            [
                'name' => '🤖 Plano Ciclo 60 Dias',
                'image' => '/assets/ecovacs-t20.jpg',
                'price' => 1500.00,
                'daily_income' => null,
                'duration_days' => 60,
                'total_return' => 10800.00,
                'max_purchases' => 0, // Ilimitado
                'type' => 'END_CYCLE',
                'description' => 'Lucro no final do ciclo + devolução do capital investido',
                'is_active' => true,
                'order' => 8,
            ],
            [
                'name' => '🤖 Plano Ciclo 90 Dias',
                'image' => '/assets/ecovacs-n30.jpg',
                'price' => 2500.00,
                'daily_income' => null,
                'duration_days' => 90,
                'total_return' => 31500.00,
                'max_purchases' => 0, // Ilimitado
                'type' => 'END_CYCLE',
                'description' => 'Lucro no final do ciclo + devolução do capital investido',
                'is_active' => true,
                'order' => 9,
            ],
        ];

        // Inserir planos padrão (apenas se não existirem)
        $createdStandard = 0;
        foreach ($standardPlans as $plan) {
            $created = Plan::firstOrCreate(
                ['name' => $plan['name']], // Buscar por nome
                $plan // Dados completos se precisar criar
            );
            if ($created->wasRecentlyCreated) {
                $createdStandard++;
            }
        }

        // Inserir planos ciclo (apenas se não existirem)
        $createdCycle = 0;
        foreach ($cyclePlans as $plan) {
            $created = Plan::firstOrCreate(
                ['name' => $plan['name']], // Buscar por nome
                $plan // Dados completos se precisar criar
            );
            if ($created->wasRecentlyCreated) {
                $createdCycle++;
            }
        }

        if ($createdStandard > 0) {
            $this->command->info('✅ ' . $createdStandard . ' planos padrão criados!');
        } else {
            $this->command->warn('ℹ️  Planos padrão já existem (nenhum criado)');
        }

        if ($createdCycle > 0) {
            $this->command->info('✅ ' . $createdCycle . ' planos ciclo criados!');
        } else {
            $this->command->warn('ℹ️  Planos ciclo já existem (nenhum criado)');
        }

        $totalPlans = Plan::count();
        $this->command->info('🎉 Total de planos no sistema: ' . $totalPlans);
    }
}
