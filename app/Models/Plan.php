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
        'is_featured',
        'featured_color',
        'featured_ends_at',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'daily_income' => 'decimal:2',
            'total_return' => 'decimal:2',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'duration_days' => 'integer',
            'max_purchases' => 'integer',
            'order' => 'integer',
            'featured_ends_at' => 'datetime',
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
        return $query->orderBy('is_featured', 'desc')
                    ->orderBy('featured_ends_at', 'desc')
                    ->orderBy('order', 'asc')
                    ->orderBy('id', 'asc');
    }

    /**
     * Scope para retornar apenas planos em promoção
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)
                    ->where(function ($q) {
                        $q->whereNull('featured_ends_at')
                          ->orWhere('featured_ends_at', '>', now());
                    });
    }

    /**
     * Verificar se a promoção ainda está ativa
     */
    public function isPromotionActive(): bool
    {
        if (!$this->is_featured) {
            return false;
        }

        if ($this->featured_ends_at === null) {
            return true; // Promoção sem data de término
        }

        return $this->featured_ends_at->isFuture();
    }
}
