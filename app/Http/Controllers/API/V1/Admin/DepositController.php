<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DepositController extends Controller
{
    /**
     * Listar todos os depósitos (com filtros)
     */
    public function index(Request $request)
    {
        $query = Deposit::with('user:id,name,email');

        // Filtros
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            })->orWhere('transaction_id', 'ilike', "%{$search}%")
              ->orWhere('order_id', 'ilike', "%{$search}%");
        }

        // Ordenação
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        // Validar coluna de ordenação
        $allowedSortBy = ['id', 'amount', 'status', 'created_at', 'paid_at', 'expires_at'];
        if (!in_array($sortBy, $allowedSortBy)) {
            $sortBy = 'created_at';
        }
        
        $query->orderBy($sortBy, $sortOrder);

        $deposits = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'data' => $deposits->map(function ($deposit) {
                return [
                    'id' => $deposit->id,
                    'user' => [
                        'id' => $deposit->user->id,
                        'name' => $deposit->user->name,
                        'email' => $deposit->user->email,
                    ],
                    'amount' => (float) $deposit->amount,
                    'status' => $deposit->status,
                    'transaction_id' => $deposit->transaction_id,
                    'order_id' => $deposit->order_id,
                    'created_at' => $deposit->created_at->toIso8601String(),
                    'paid_at' => $deposit->paid_at?->toIso8601String(),
                    'expires_at' => $deposit->expires_at?->toIso8601String(),
                ];
            }),
            'meta' => [
                'current_page' => $deposits->currentPage(),
                'last_page' => $deposits->lastPage(),
                'per_page' => $deposits->perPage(),
                'total' => $deposits->total(),
            ]
        ]);
    }

    /**
     * Estatísticas gerais de depósitos
     */
    public function stats()
    {
        $total = Deposit::count();
        $pending = Deposit::where('status', 'PENDING')->count();
        $paid = Deposit::where('status', 'PAID')->count();
        $expired = Deposit::where('status', 'EXPIRED')->count();
        $cancelled = Deposit::where('status', 'CANCELLED')->count();
        
        $totalAmount = (float) Deposit::where('status', 'PAID')->sum('amount');
        $pendingAmount = (float) Deposit::where('status', 'PENDING')->sum('amount');

        return response()->json([
            'data' => [
                'summary' => [
                    'total' => $total,
                    'pending' => $pending,
                    'paid' => $paid,
                    'expired' => $expired,
                    'cancelled' => $cancelled,
                ],
                'amounts' => [
                    'total_paid' => $totalAmount,
                    'pending' => $pendingAmount,
                ],
            ],
        ]);
    }

    /**
     * Ver detalhes de um depósito específico
     */
    public function show($id)
    {
        $deposit = Deposit::with('user:id,name,email,phone,balance,balance_withdrawn')
            ->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $deposit->id,
                'user' => [
                    'id' => $deposit->user->id,
                    'name' => $deposit->user->name,
                    'email' => $deposit->user->email,
                    'phone' => $deposit->user->phone,
                    'balance' => (float) $deposit->user->balance,
                    'balance_withdrawn' => (float) $deposit->user->balance_withdrawn,
                ],
                'amount' => (float) $deposit->amount,
                'status' => $deposit->status,
                'transaction_id' => $deposit->transaction_id,
                'order_id' => $deposit->order_id,
                'qr_code' => $deposit->qr_code,
                'qr_code_image' => $deposit->qr_code_image,
                'order_url' => $deposit->order_url,
                'created_at' => $deposit->created_at->toIso8601String(),
                'paid_at' => $deposit->paid_at?->toIso8601String(),
                'expires_at' => $deposit->expires_at?->toIso8601String(),
            ],
        ]);
    }
}

