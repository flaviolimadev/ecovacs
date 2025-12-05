<?php

namespace App\Http\Controllers\API\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\WebhookEvent;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    /**
     * Listar todos os webhooks com filtros
     */
    public function index(Request $request)
    {
        $query = WebhookEvent::with(['deposit.user:id,name,email'])
            ->orderBy('created_at', 'desc');

        // Filtro por status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filtro por provider
        if ($request->filled('provider')) {
            $query->where('provider', $request->provider);
        }

        // Filtro para webhooks atrasados
        if ($request->filled('late_only') && $request->late_only === 'true') {
            $query->where('status', 'late_arrival');
        }

        // Busca por external_id ou deposit_id
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('external_id', 'like', "%{$search}%")
                  ->orWhere('deposit_id', $search);
            });
        }

        $perPage = $request->get('per_page', 20);
        $webhooks = $query->paginate($perPage);

        return response()->json([
            'data' => $webhooks->map(function ($webhook) {
                return [
                    'id' => $webhook->id,
                    'provider' => $webhook->provider,
                    'event' => $webhook->event,
                    'external_id' => $webhook->external_id,
                    'status' => $webhook->status,
                    'deposit_id' => $webhook->deposit_id,
                    'deposit' => $webhook->deposit ? [
                        'id' => $webhook->deposit->id,
                        'amount' => (float) $webhook->deposit->amount,
                        'status' => $webhook->deposit->status,
                        'paid_at' => $webhook->deposit->paid_at?->toIso8601String(),
                        'user' => $webhook->deposit->user ? [
                            'id' => $webhook->deposit->user->id,
                            'name' => $webhook->deposit->user->name,
                            'email' => $webhook->deposit->user->email,
                        ] : null,
                    ] : null,
                    'error_message' => $webhook->error_message,
                    'created_at' => $webhook->created_at->toIso8601String(),
                    'processed_at' => $webhook->processed_at?->toIso8601String(),
                    'is_late' => $webhook->status === 'late_arrival',
                ];
            }),
            'meta' => [
                'current_page' => $webhooks->currentPage(),
                'last_page' => $webhooks->lastPage(),
                'per_page' => $webhooks->perPage(),
                'total' => $webhooks->total(),
            ]
        ]);
    }

    /**
     * Estatísticas de webhooks
     */
    public function stats()
    {
        $total = WebhookEvent::count();
        $received = WebhookEvent::where('status', 'received')->count();
        $processed = WebhookEvent::where('status', 'processed')->count();
        $failed = WebhookEvent::where('status', 'failed')->count();
        $lateArrival = WebhookEvent::where('status', 'late_arrival')->count();

        return response()->json([
            'data' => [
                'total' => $total,
                'received' => $received,
                'processed' => $processed,
                'failed' => $failed,
                'late_arrival' => $lateArrival,
            ]
        ]);
    }

    /**
     * Ver detalhes de um webhook específico
     */
    public function show($id)
    {
        $webhook = WebhookEvent::with(['deposit.user'])->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $webhook->id,
                'provider' => $webhook->provider,
                'event' => $webhook->event,
                'external_id' => $webhook->external_id,
                'idempotency_hash' => $webhook->idempotency_hash,
                'status' => $webhook->status,
                'deposit_id' => $webhook->deposit_id,
                'deposit' => $webhook->deposit ? [
                    'id' => $webhook->deposit->id,
                    'amount' => (float) $webhook->deposit->amount,
                    'status' => $webhook->deposit->status,
                    'transaction_id' => $webhook->deposit->transaction_id,
                    'order_id' => $webhook->deposit->order_id,
                    'paid_at' => $webhook->deposit->paid_at?->toIso8601String(),
                    'created_at' => $webhook->deposit->created_at->toIso8601String(),
                    'user' => $webhook->deposit->user ? [
                        'id' => $webhook->deposit->user->id,
                        'name' => $webhook->deposit->user->name,
                        'email' => $webhook->deposit->user->email,
                        'phone' => $webhook->deposit->user->phone,
                    ] : null,
                ] : null,
                'headers' => $webhook->headers,
                'payload' => $webhook->payload,
                'error_message' => $webhook->error_message,
                'created_at' => $webhook->created_at->toIso8601String(),
                'processed_at' => $webhook->processed_at?->toIso8601String(),
                'is_late' => $webhook->status === 'late_arrival',
            ]
        ]);
    }
}

