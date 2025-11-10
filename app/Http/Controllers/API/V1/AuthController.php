<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Models\Referral;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(RegisterRequest $request)
    {
        try {
            DB::beginTransaction();
            
            // Find referrer (now required)
            $referrer = User::where('referral_code', $request->referral_code)->first();
            
            if (!$referrer) {
                return response()->json([
                    'message' => 'Código de indicação inválido',
                    'errors' => [
                        'referral_code' => ['O código de indicação não existe'],
                    ],
                ], 422);
            }

            // Create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'referral_code' => $this->generateUniqueReferralCode(),
                'referred_by' => $referrer->id,
            ]);

            // Create referral records for all levels
            $this->createReferralChain($referrer, $user);

            DB::commit();

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Cadastro realizado com sucesso!',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'role' => $user->role ?? 'user',
                        'referral_code' => $user->referral_code,
                        'balance' => (float) $user->balance,                    // Saldo para investir
                        'balance_withdrawn' => (float) $user->balance_withdrawn, // Saldo para sacar
                    ],
                    'token' => $token,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erro ao realizar cadastro',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login user
     */
    public function login(LoginRequest $request)
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Credenciais inválidas',
            ], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        // Check if user is active
        if (!$user->is_active) {
            return response()->json([
                'message' => 'Sua conta está inativa. Entre em contato com o suporte.',
            ], 403);
        }

        // Create token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso!',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role ?? 'user',
                    'referral_code' => $user->referral_code,
                    'balance' => (float) $user->balance,                    // Saldo para investir
                    'balance_withdrawn' => (float) $user->balance_withdrawn, // Saldo para sacar
                    'total_invested' => (float) $user->total_invested,
                    'total_earned' => (float) $user->total_earned,
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso!',
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role ?? 'user',
                    'referral_code' => $user->referral_code,
                    'balance' => (float) $user->balance,                    // Saldo para investir
                    'balance_withdrawn' => (float) $user->balance_withdrawn, // Saldo para sacar
                    'total_invested' => (float) $user->total_invested,
                    'total_earned' => (float) $user->total_earned,
                    'total_withdrawn' => (float) $user->total_withdrawn,
                    'is_verified' => (bool) $user->is_verified,
                ],
            ],
        ]);
    }

    /**
     * Generate unique referral code
     */
    private function generateUniqueReferralCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (User::where('referral_code', $code)->exists());

        return $code;
    }

    /**
     * Create referral chain for new user
     * Creates referral records for up to 3 levels
     */
    private function createReferralChain(User $referrer, User $newUser): void
    {
        $currentUser = $referrer;
        $level = 1;
        $maxLevels = 3; // Máximo de níveis na árvore

        while ($currentUser && $level <= $maxLevels) {
            // Criar registro de referral
            Referral::create([
                'user_id' => $currentUser->id,
                'referred_user_id' => $newUser->id,
                'level' => $level,
            ]);

            // Subir na árvore para o próximo nível
            if ($currentUser->referred_by) {
                $currentUser = User::find($currentUser->referred_by);
                $level++;
            } else {
                break;
            }
        }
    }
}
