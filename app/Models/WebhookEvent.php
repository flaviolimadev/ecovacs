<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookEvent extends Model
{
    protected $fillable = [
        'provider',
        'event',
        'external_id',
        'idempotency_hash',
        'headers',
        'payload',
        'status',
        'deposit_id',
        'processed_at',
        'error_message',
    ];

    protected $casts = [
        'headers' => 'array',
        'payload' => 'array',
        'processed_at' => 'datetime',
    ];

    /**
     * Relacionamento com Deposit
     */
    public function deposit(): BelongsTo
    {
        return $this->belongsTo(Deposit::class);
    }

    /**
     * Escopo para webhooks recebidos
     */
    public function scopeReceived($query)
    {
        return $query->where('status', 'received');
    }

    /**
     * Escopo para webhooks processados
     */
    public function scopeProcessed($query)
    {
        return $query->where('status', 'processed');
    }

    /**
     * Escopo para webhooks com falha
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Escopo para webhooks atrasados (chegaram depois do pagamento manual)
     */
    public function scopeLateArrival($query)
    {
        return $query->where('status', 'late_arrival');
    }
}

