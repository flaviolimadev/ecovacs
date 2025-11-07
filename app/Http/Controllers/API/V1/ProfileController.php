<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * Get authenticated user profile
     */
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'referral_code' => $user->referral_code,
                'balance' => (float) $user->balance,                    // Saldo para investir
                'balance_withdrawn' => (float) $user->balance_withdrawn, // Saldo para sacar
                'total_invested' => (float) $user->total_invested,
                'total_earned' => (float) $user->total_earned,
                'total_withdrawn' => (float) $user->total_withdrawn,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    /**
     * Update user profile
     */
    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
        ]);

        return response()->json([
            'message' => 'Perfil atualizado com sucesso',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'referral_code' => $user->referral_code,
                'balance' => (float) $user->balance,                    // Saldo para investir
                'balance_withdrawn' => (float) $user->balance_withdrawn, // Saldo para sacar
                'total_invested' => (float) $user->total_invested,
                'total_earned' => (float) $user->total_earned,
                'total_withdrawn' => (float) $user->total_withdrawn,
            ],
        ]);
    }

    /**
     * Update user password
     */
    public function updatePassword(UpdatePasswordRequest $request)
    {
        $user = $request->user();

        // Verificar se a senha atual está correta
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Senha atual incorreta',
                'errors' => [
                    'current_password' => ['A senha atual está incorreta'],
                ],
            ], 422);
        }

        // Atualizar senha
        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        // Invalidar outros tokens (opcional - força relogin em outros dispositivos)
        // $user->tokens()->delete();

        return response()->json([
            'message' => 'Senha alterada com sucesso',
        ]);
    }

    /**
     * Get user financial statement
     */
    public function statement(Request $request)
    {
        $user = $request->user();
        $perPage = $request->query('per_page', 20);

        // Buscar comissões recebidas
        $commissions = $user->commissionsReceived()
            ->with(['fromUser', 'cycle.plan'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $transactions = $commissions->map(function ($commission) {
            return [
                'id' => $commission->id,
                'date' => $commission->created_at->format('Y-m-d H:i:s'),
                'type' => 'commission',
                'type_label' => 'Comissão',
                'description' => $commission->description,
                'amount' => (float) $commission->amount,
                'details' => [
                    'level' => $commission->level,
                    'percentage' => (float) $commission->percentage,
                    'from_user' => $commission->fromUser->name,
                    'purchase_amount' => (float) $commission->purchase_amount,
                    'commission_type' => $commission->type === 'FIRST_PURCHASE' ? 'Primeira Compra' : 'Compra Subsequente',
                ],
                'status' => 'completed',
                'status_label' => 'Concluído',
            ];
        });

        return response()->json([
            'data' => $transactions,
            'pagination' => [
                'current_page' => $commissions->currentPage(),
                'last_page' => $commissions->lastPage(),
                'per_page' => $commissions->perPage(),
                'total' => $commissions->total(),
            ],
            'summary' => [
                'total_commissions_received' => (float) $user->commissionsReceived()->sum('amount'),
                'commissions_count' => $user->commissionsReceived()->count(),
                'balance' => (float) $user->balance,
                'balance_withdrawn' => (float) $user->balance_withdrawn,
            ],
        ]);
    }
}

