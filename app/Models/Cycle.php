<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cycle extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'amount',
        'type',
        'duration_days',
        'started_at',
        'ends_at',
        'status',
        'is_first_purchase',
        'daily_income',
        'total_return',
        'total_paid',
        'days_paid',
        'last_payment_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'daily_income' => 'decimal:2',
            'total_return' => 'decimal:2',
            'total_paid' => 'decimal:2',
            'is_first_purchase' => 'boolean',
            'duration_days' => 'integer',
            'days_paid' => 'integer',
            'started_at' => 'datetime',
            'ends_at' => 'datetime',
            'last_payment_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the cycle
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the plan for this cycle
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Scope para ciclos ativos
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Scope para ciclos finalizados
     */
    public function scopeFinished($query)
    {
        return $query->where('status', 'FINISHED');
    }

    /**
     * Scope para ciclos por tipo
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Verificar se o ciclo está ativo
     */
    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }

    /**
     * Verificar se o ciclo foi finalizado
     */
    public function isFinished(): bool
    {
        return $this->status === 'FINISHED';
    }

    /**
     * Calcular progresso do ciclo (%)
     */
    public function getProgressPercentage(): float
    {
        if ($this->duration_days <= 0) {
            return 0;
        }

        return min(100, ($this->days_paid / $this->duration_days) * 100);
    }

    /**
     * Verificar se pode receber pagamento hoje
     */
    public function canReceivePaymentToday(): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        if ($this->type === 'END_CYCLE') {
            return false; // Ciclo só paga no final
        }

        // Verificar se já recebeu pagamento hoje
        if ($this->last_payment_at && $this->last_payment_at->isToday()) {
            return false;
        }

        // Verificar se já completou todos os dias
        if ($this->days_paid >= $this->duration_days) {
            return false;
        }

        return true;
    }
}
