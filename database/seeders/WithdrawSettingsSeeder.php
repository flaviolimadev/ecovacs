<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WithdrawSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'withdraw.window',
                'value' => json_encode([
                    'days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    'start' => '10:00',
                    'end' => '17:00',
                ]),
                'group' => 'withdraw',
                'description' => 'Janela de horário permitida para saques (dias úteis, 10h-17h)',
            ],
            [
                'key' => 'withdraw.min',
                'value' => '50',
                'group' => 'withdraw',
                'description' => 'Valor mínimo de saque em reais',
            ],
            [
                'key' => 'withdraw.fee',
                'value' => '0.10',
                'group' => 'withdraw',
                'description' => 'Taxa de saque (percentual, ex: 0.10 = 10%)',
            ],
            [
                'key' => 'withdraw.daily_limit_per_user',
                'value' => '1',
                'group' => 'withdraw',
                'description' => 'Número máximo de saques por usuário por dia',
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('✅ Configurações de saque criadas/atualizadas com sucesso!');
    }
}

