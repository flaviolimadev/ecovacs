<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deposit extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'transaction_id',
        'order_id',
        'status',
        'qr_code',
        'qr_code_base64',
        'qr_code_image',
        'order_url',
        'raw_response',
        'paid_at',
        'expires_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'raw_response' => 'array',
        'paid_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Relacionamento: Depósito pertence a um usuário
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'PENDING');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'PAID');
    }

    /**
     * Marcar depósito como pago e creditar saldo do usuário
     */
    public function markAsPaid(): void
    {
        $this->update([
            'status' => 'PAID',
            'paid_at' => now(),
        ]);

        // Creditar saldo do usuário
        $this->user->increment('balance', $this->amount);

        // Registrar no ledger
        \App\Models\Ledger::create([
            'user_id' => $this->user_id,
            'type' => 'DEPOSIT',
            'amount' => $this->amount,
            'description' => 'Depósito via PIX',
            'reference_id' => $this->id,
            'reference_type' => 'DEPOSIT',
        ]);
    }
}
