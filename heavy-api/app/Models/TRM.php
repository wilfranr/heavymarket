<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo TRM (Tasa Representativa del Mercado)
 *
 * Representa la tasa de cambio USD a COP (Tasa Representativa del Mercado).
 * Generalmente se actualiza diariamente.
 *
 * @property int $id
 * @property float $trm
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class TRM extends Model
{
    use HasFactory;

    protected $table = 'trms';

    protected $fillable = [
        'trm',
    ];

    protected $casts = [
        'trm' => 'float',
    ];
}
