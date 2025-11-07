<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Commission extends Model
{
    protected $fillable = [
        'user_id',
        'from_user_id',
        'cycle_id',
        'level',
        'amount',
        'purchase_amount',
        'percentage',
        'type',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'purchase_amount' => 'decimal:2',
            'percentage' => 'decimal:2',
            'level' => 'integer',
        ];
    }

    /**
     * Usuário que recebeu a comissão
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Usuário que fez a compra (origem da comissão)
     */
    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    /**
     * Ciclo que gerou a comissão
     */
    public function cycle(): BelongsTo
    {
        return $this->belongsTo(Cycle::class);
    }
}
