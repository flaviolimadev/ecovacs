<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Earning extends Model
{
    protected $fillable = [
        'cycle_id',
        'user_id',
        'reference_date',
        'value',
        'type',
        'is_paid',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'reference_date' => 'date',
            'is_paid' => 'boolean',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * Ciclo que gerou este rendimento
     */
    public function cycle(): BelongsTo
    {
        return $this->belongsTo(Cycle::class);
    }

    /**
     * Usuário que recebeu o rendimento
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope para rendimentos pagos
     */
    public function scopePaid($query)
    {
        return $query->where('is_paid', true);
    }

    /**
     * Scope para rendimentos pendentes
     */
    public function scopePending($query)
    {
        return $query->where('is_paid', false);
    }

    /**
     * Scope por tipo
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
