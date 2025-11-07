<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyReward extends Model
{
    protected $fillable = [
        'user_id',
        'claim_date',
        'amount',
    ];

    protected function casts(): array
    {
        return [
            'claim_date' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    /**
     * Usuário que recebeu o prêmio
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
