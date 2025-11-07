<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'image',
        'price',
        'daily_income',
        'duration_days',
        'total_return',
        'max_purchases',
        'type',
        'description',
        'is_active',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'daily_income' => 'decimal:2',
            'total_return' => 'decimal:2',
            'is_active' => 'boolean',
            'duration_days' => 'integer',
            'max_purchases' => 'integer',
            'order' => 'integer',
        ];
    }

    /**
     * Scope para retornar apenas planos ativos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para retornar planos por tipo
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope para ordenar planos
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order', 'asc')->orderBy('id', 'asc');
    }
}
