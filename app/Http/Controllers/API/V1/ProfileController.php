<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Models\Ledger;
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
     * Get user financial statement (Extrato)
     */
    public function statement(Request $request)
    {
        $user = $request->user();
        $perPage = $request->query('per_page', 20);
        $type = $request->query('type'); // INVESTMENT, COMMISSION, EARNING, WITHDRAWAL, DEPOSIT

        // Buscar transações do extrato (Ledger)
        $query = Ledger::where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        // Filtrar por tipo se especificado
        if ($type) {
            $query->where('type', $type);
        }

        $ledgerEntries = $query->paginate($perPage);

        // Mapear labels dos tipos
        $typeLabels = [
            'INVESTMENT' => 'Investimento',
            'COMMISSION' => 'Comissão',
            'EARNING' => 'Rendimento',
            'WITHDRAWAL' => 'Saque',
            'DEPOSIT' => 'Depósito',
        ];

        $transactions = $ledgerEntries->map(function ($entry) use ($typeLabels) {
            return [
                'id' => $entry->id,
                'date' => $entry->created_at->format('Y-m-d H:i:s'),
                'type' => strtolower($entry->type),
                'type_label' => $typeLabels[$entry->type] ?? $entry->type,
                'description' => $entry->description,
                'amount' => (float) $entry->amount,
                'operation' => $entry->operation, // CREDIT ou DEBIT
                'balance_before' => (float) $entry->balance_before,
                'balance_after' => (float) $entry->balance_after,
                'status' => 'completed',
                'status_label' => 'Concluído',
            ];
        });

        // Resumo financeiro
        $totalCredits = Ledger::where('user_id', $user->id)
            ->where('operation', 'CREDIT')
            ->sum('amount');

        $totalDebits = Ledger::where('user_id', $user->id)
            ->where('operation', 'DEBIT')
            ->sum('amount');

        return response()->json([
            'data' => $transactions,
            'pagination' => [
                'current_page' => $ledgerEntries->currentPage(),
                'last_page' => $ledgerEntries->lastPage(),
                'per_page' => $ledgerEntries->perPage(),
                'total' => $ledgerEntries->total(),
            ],
            'summary' => [
                'total_credits' => (float) $totalCredits,
                'total_debits' => (float) $totalDebits,
                'net_balance' => (float) ($totalCredits - $totalDebits),
                'balance' => (float) $user->balance,
                'balance_withdrawn' => (float) $user->balance_withdrawn,
                'total_transactions' => Ledger::where('user_id', $user->id)->count(),
            ],
        ]);
    }
}

