<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    /**
     * Listar todas as configurações
     */
    public function index()
    {
        $settings = DB::table('settings')->get();

        $grouped = [];
        foreach ($settings as $setting) {
            // Agrupar por prefixo (ex: withdraw, deposit, yield)
            $parts = explode('.', $setting->key);
            $group = $parts[0] ?? 'general';
            
            if (!isset($grouped[$group])) {
                $grouped[$group] = [];
            }
            
            // Tentar decodificar JSON, senão usar valor direto
            $value = $setting->value;
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $value = $decoded;
            } elseif (is_numeric($value)) {
                $value = (float) $value;
            }
            
            $grouped[$group][] = [
                'key' => $setting->key,
                'value' => $value,
                'description' => $setting->description,
            ];
        }

        return response()->json([
            'data' => $grouped,
        ]);
    }

    /**
     * Atualizar uma configuração específica
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'key' => 'required|string',
            'value' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Dados inválidos',
                    'details' => $validator->errors()
                ]
            ], 422);
        }

        $key = $request->key;
        $value = $request->value;

        // Buscar configuração existente
        $setting = DB::table('settings')->where('key', $key)->first();

        if (!$setting) {
            return response()->json([
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Configuração não encontrada',
                ]
            ], 404);
        }

        // Formatar valor (JSON para arrays/objetos, string para o resto)
        $formattedValue = is_array($value) ? json_encode($value) : (string) $value;

        // Atualizar
        DB::table('settings')
            ->where('key', $key)
            ->update([
                'value' => $formattedValue,
                'updated_at' => now(),
            ]);

        // Limpar cache
        Cache::forget('settings');
        Cache::forget('setting_' . $key);

        return response()->json([
            'message' => 'Configuração atualizada com sucesso!',
            'data' => [
                'key' => $key,
                'value' => is_array($value) ? $value : $formattedValue,
            ]
        ]);
    }

    /**
     * Atualizar múltiplas configurações de uma vez
     */
    public function updateBulk(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Dados inválidos',
                    'details' => $validator->errors()
                ]
            ], 422);
        }

        try {
            DB::beginTransaction();

            $updated = [];

            foreach ($request->settings as $settingData) {
                $key = $settingData['key'];
                $value = $settingData['value'];

                $setting = DB::table('settings')->where('key', $key)->first();

                if (!$setting) {
                    continue;
                }

                $formattedValue = is_array($value) ? json_encode($value) : (string) $value;

                DB::table('settings')
                    ->where('key', $key)
                    ->update([
                        'value' => $formattedValue,
                        'updated_at' => now(),
                    ]);

                $updated[] = $key;
            }

            DB::commit();

            // Limpar cache
            Cache::forget('settings');
            foreach ($updated as $key) {
                Cache::forget('setting_' . $key);
            }

            return response()->json([
                'message' => count($updated) . ' configurações atualizadas com sucesso!',
                'data' => [
                    'updated_keys' => $updated,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'error' => [
                    'code' => 'UPDATE_ERROR',
                    'message' => 'Erro ao atualizar configurações: ' . $e->getMessage(),
                ]
            ], 500);
        }
    }

    /**
     * Obter configurações de saque (específico)
     */
    public function getWithdrawSettings()
    {
        $window = DB::table('settings')->where('key', 'withdraw.window')->first();
        $min = DB::table('settings')->where('key', 'withdraw.min')->first();
        $fee = DB::table('settings')->where('key', 'withdraw.fee')->first();
        $dailyLimit = DB::table('settings')->where('key', 'withdraw.daily_limit_per_user')->first();

        return response()->json([
            'data' => [
                'window' => $window ? json_decode($window->value, true) : null,
                'min_amount' => $min ? (float) $min->value : 50,
                'fee_percent' => $fee ? (float) $fee->value : 0.10,
                'daily_limit_per_user' => $dailyLimit ? (int) $dailyLimit->value : 1,
            ]
        ]);
    }

    /**
     * Atualizar configurações de saque
     */
    public function updateWithdrawSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'window' => 'sometimes|array',
            'window.days' => 'sometimes|array',
            'window.start' => 'sometimes|string|regex:/^\d{2}:\d{2}$/',
            'window.end' => 'sometimes|string|regex:/^\d{2}:\d{2}$/',
            'min_amount' => 'sometimes|numeric|min:0',
            'fee_percent' => 'sometimes|numeric|min:0|max:1',
            'daily_limit_per_user' => 'sometimes|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Dados inválidos',
                    'details' => $validator->errors()
                ]
            ], 422);
        }

        try {
            DB::beginTransaction();

            if ($request->has('window')) {
                DB::table('settings')
                    ->where('key', 'withdraw.window')
                    ->update([
                        'value' => json_encode($request->window),
                        'updated_at' => now(),
                    ]);
            }

            if ($request->has('min_amount')) {
                DB::table('settings')
                    ->where('key', 'withdraw.min')
                    ->update([
                        'value' => (string) $request->min_amount,
                        'updated_at' => now(),
                    ]);
            }

            if ($request->has('fee_percent')) {
                DB::table('settings')
                    ->where('key', 'withdraw.fee')
                    ->update([
                        'value' => (string) $request->fee_percent,
                        'updated_at' => now(),
                    ]);
            }

            if ($request->has('daily_limit_per_user')) {
                DB::table('settings')
                    ->where('key', 'withdraw.daily_limit_per_user')
                    ->update([
                        'value' => (string) $request->daily_limit_per_user,
                        'updated_at' => now(),
                    ]);
            }

            DB::commit();

            // Limpar cache
            Cache::forget('settings');
            Cache::tags(['settings', 'withdraw'])->flush();

            return response()->json([
                'message' => 'Configurações de saque atualizadas com sucesso!',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'error' => [
                    'code' => 'UPDATE_ERROR',
                    'message' => 'Erro ao atualizar: ' . $e->getMessage(),
                ]
            ], 500);
        }
    }

}

