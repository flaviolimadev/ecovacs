<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Ledger extends Model
{
    protected $table = 'ledger';

    protected $fillable = [
        'user_id',
        'type',
        'reference_type',
        'reference_id',
        'description',
        'amount',
        'operation',
        'balance_before',
        'balance_after',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'balance_before' => 'decimal:2',
            'balance_after' => 'decimal:2',
        ];
    }

    /**
     * Usuário dono da transação
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Referência polimórfica (Cycle, Commission, Earning, etc)
     */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope para filtrar por tipo
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope para filtrar por operação (CREDIT/DEBIT)
     */
    public function scopeByOperation($query, string $operation)
    {
        return $query->where('operation', $operation);
    }
}
