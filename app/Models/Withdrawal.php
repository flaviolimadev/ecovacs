<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Withdrawal extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'fee_amount',
        'net_amount',
        'cpf',
        'pix_key',
        'pix_key_type',
        'status',
        'transaction_id',
        'raw_response',
        'error_message',
        'rejection_reason',
        'provider_response',
        'requested_at',
        'approved_at',
        'processed_at',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'raw_response' => 'array',
        'provider_response' => 'array',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'processed_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    /**
     * Relacionamento com User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope para saques pendentes
     */
    public function scopeRequested($query)
    {
        return $query->where('status', 'REQUESTED');
    }

    /**
     * Scope para saques aprovados
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'APPROVED');
    }

    /**
     * Scope para saques pagos
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'PAID');
    }

    /**
     * Scope para saques de um dia específico
     */
    public function scopeOnDate($query, $date)
    {
        return $query->whereDate('requested_at', $date);
    }

    /**
     * Marcar como aprovado
     */
    public function approve(): void
    {
        $this->update([
            'status' => 'APPROVED',
            'approved_at' => now(),
        ]);
    }

    /**
     * Marcar como pago
     */
    public function markAsPaid(?string $transactionId = null): void
    {
        $this->update([
            'status' => 'PAID',
            'transaction_id' => $transactionId ?? $this->transaction_id,
            'paid_at' => now(),
            'processed_at' => $this->processed_at ?? now(),
        ]);
    }

    /**
     * Rejeitar saque
     */
    public function reject(string $reason): void
    {
        $this->update([
            'status' => 'REJECTED',
            'rejection_reason' => $reason,
            'processed_at' => now(),
        ]);
    }
}

