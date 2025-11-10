<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Listar todos os usuários
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        $search = $request->get('search');
        $role = $request->get('role');
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $query = User::query();

        // Busca por nome, email, CPF (se existir) ou código de indicação
        if ($search) {
            $searchLower = strtolower($search);
            $query->where(function ($q) use ($search, $searchLower) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$searchLower}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$searchLower}%"])
                  ->orWhereRaw('LOWER(referral_code) LIKE ?', ["%{$searchLower}%"]);
                
                // Só busca por CPF se a coluna existir
                if (Schema::hasColumn('users', 'cpf')) {
                    $q->orWhereRaw('LOWER(cpf::text) LIKE ?', ["%{$searchLower}%"]);
                }
            });
        }

        // Filtrar por role
        if ($role) {
            $query->where('role', $role);
        }

        // Ordenação
        $query->orderBy($sortBy, $sortOrder);

        $users = $query->paginate($perPage);

        return response()->json([
            'data' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'cpf' => $user->cpf,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'balance' => (float) $user->balance,
                    'balance_withdrawn' => (float) $user->balance_withdrawn,
                    'total_invested' => (float) $user->total_invested,
                    'total_earned' => (float) $user->total_earned,
                    'total_withdrawn' => (float) $user->total_withdrawn,
                    'referral_code' => $user->referral_code,
                    'referred_by_id' => $user->referred_by_id,
                    'referred_by' => $user->referredBy ? [
                        'id' => $user->referredBy->id,
                        'name' => $user->referredBy->name,
                        'email' => $user->referredBy->email,
                    ] : null,
                    'direct_referrals_count' => $user->referrals()->count(),
                    'created_at' => $user->created_at->toIso8601String(),
                    'updated_at' => $user->updated_at->toIso8601String(),
                ];
            }),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Buscar usuário específico
     */
    public function show(int $id)
    {
        $user = User::with(['referredBy', 'referrals'])->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'cpf' => $user->cpf,
                'phone' => $user->phone,
                'role' => $user->role,
                'balance' => (float) $user->balance,
                'balance_withdrawn' => (float) $user->balance_withdrawn,
                'total_invested' => (float) $user->total_invested,
                'total_earned' => (float) $user->total_earned,
                'total_withdrawn' => (float) $user->total_withdrawn,
                'referral_code' => $user->referral_code,
                'referred_by_id' => $user->referred_by_id,
                'referred_by' => $user->referredBy ? [
                    'id' => $user->referredBy->id,
                    'name' => $user->referredBy->name,
                    'email' => $user->referredBy->email,
                    'referral_code' => $user->referredBy->referral_code,
                ] : null,
                'direct_referrals' => $user->referrals->map(function ($ref) {
                    return [
                        'id' => $ref->id,
                        'name' => $ref->name,
                        'email' => $ref->email,
                        'created_at' => $ref->created_at->toIso8601String(),
                    ];
                }),
                'created_at' => $user->created_at->toIso8601String(),
                'updated_at' => $user->updated_at->toIso8601String(),
            ]
        ]);
    }

    /**
     * Atualizar usuário
     */
    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'cpf' => ['sometimes', 'string', 'regex:/^\d{11}$/', Rule::unique('users')->ignore($user->id)],
            'phone' => 'sometimes|nullable|string|max:20',
            'role' => 'sometimes|in:user,admin',
            'password' => 'sometimes|string|min:6',
            'balance' => 'sometimes|numeric|min:0',
            'balance_withdrawn' => 'sometimes|numeric|min:0',
            'total_invested' => 'sometimes|numeric|min:0',
            'total_earned' => 'sometimes|numeric|min:0',
            'total_withdrawn' => 'sometimes|numeric|min:0',
            'referred_by_id' => 'sometimes|nullable|exists:users,id',
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

        $data = $request->only([
            'name',
            'email',
            'cpf',
            'phone',
            'role',
            'balance',
            'balance_withdrawn',
            'total_invested',
            'total_earned',
            'total_withdrawn',
            'referred_by_id',
        ]);

        // Se estiver alterando senha, hash ela
        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'cpf' => $user->cpf,
                'phone' => $user->phone,
                'role' => $user->role,
                'balance' => (float) $user->balance,
                'balance_withdrawn' => (float) $user->balance_withdrawn,
                'total_invested' => (float) $user->total_invested,
                'total_earned' => (float) $user->total_earned,
                'total_withdrawn' => (float) $user->total_withdrawn,
                'updated_at' => $user->updated_at->toIso8601String(),
            ],
            'message' => 'Usuário atualizado com sucesso',
        ]);
    }

    /**
     * Deletar usuário
     */
    public function destroy(int $id)
    {
        $user = User::findOrFail($id);

        // Não permitir deletar o próprio usuário admin
        if ($user->id === auth()->id()) {
            return response()->json([
                'error' => [
                    'code' => 'CANNOT_DELETE_SELF',
                    'message' => 'Você não pode deletar sua própria conta',
                ]
            ], 400);
        }

        // Não permitir deletar se tiver saldo
        if ($user->balance > 0 || $user->balance_withdrawn > 0) {
            return response()->json([
                'error' => [
                    'code' => 'USER_HAS_BALANCE',
                    'message' => 'Não é possível deletar usuário com saldo. Zere os saldos primeiro.',
                    'details' => [
                        'balance' => (float) $user->balance,
                        'balance_withdrawn' => (float) $user->balance_withdrawn,
                    ]
                ]
            ], 400);
        }

        $user->delete();

        return response()->json([
            'message' => 'Usuário deletado com sucesso',
        ]);
    }

    /**
     * Estatísticas gerais
     */
    public function stats()
    {
        $totalUsers = User::count();
        $totalAdmins = User::where('role', 'admin')->count();
        $totalRegularUsers = User::where('role', 'user')->count();
        $usersToday = User::whereDate('created_at', today())->count();
        $usersThisWeek = User::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $usersThisMonth = User::whereMonth('created_at', now()->month)->count();
        
        $totalBalance = User::sum('balance');
        $totalBalanceWithdrawn = User::sum('balance_withdrawn');
        $totalInvested = User::sum('total_invested');
        $totalEarned = User::sum('total_earned');
        $totalWithdrawn = User::sum('total_withdrawn');

        return response()->json([
            'data' => [
                'users' => [
                    'total' => $totalUsers,
                    'admins' => $totalAdmins,
                    'regular' => $totalRegularUsers,
                    'today' => $usersToday,
                    'this_week' => $usersThisWeek,
                    'this_month' => $usersThisMonth,
                ],
                'balances' => [
                    'total_balance' => (float) $totalBalance,
                    'total_balance_withdrawn' => (float) $totalBalanceWithdrawn,
                    'total_invested' => (float) $totalInvested,
                    'total_earned' => (float) $totalEarned,
                    'total_withdrawn' => (float) $totalWithdrawn,
                ],
            ]
        ]);
    }

    /**
     * Ajustar saldo manualmente
     */
    public function adjustBalance(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'type' => 'required|in:balance,balance_withdrawn',
            'action' => 'required|in:add,subtract,set',
            'amount' => 'required|numeric|min:0',
            'reason' => 'required|string|max:500',
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

        $type = $request->type;
        $action = $request->action;
        $amount = (float) $request->amount;
        $reason = $request->reason;

        $oldValue = $user->$type;

        switch ($action) {
            case 'add':
                $user->$type += $amount;
                break;
            case 'subtract':
                $user->$type = max(0, $user->$type - $amount);
                break;
            case 'set':
                $user->$type = $amount;
                break;
        }

        $user->save();

        // Registrar no ledger
        \App\Models\Ledger::create([
            'user_id' => $user->id,
            'ref_type' => 'ADMIN_ADJUSTMENT',
            'ref_id' => auth()->id(),
            'description' => "Ajuste manual por admin: {$reason}",
            'amount' => $user->$type - $oldValue,
        ]);

        return response()->json([
            'data' => [
                'user_id' => $user->id,
                'type' => $type,
                'old_value' => (float) $oldValue,
                'new_value' => (float) $user->$type,
                'difference' => (float) ($user->$type - $oldValue),
            ],
            'message' => 'Saldo ajustado com sucesso',
        ]);
    }
}

