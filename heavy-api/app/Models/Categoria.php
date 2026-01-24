<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Categoria
 *
 * Representa una categoría de productos que puede estar asociada
 * a múltiples terceros (proveedores) y referencias.
 *
 * @property int $id
 * @property string $nombre
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\Tercero[] $terceros
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\Referencia[] $referencias
 */
class Categoria extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
    ];

    /**
     * Relación many-to-many con Terceros (proveedores)
     */
    public function terceros(): BelongsToMany
    {
        return $this->belongsToMany(Tercero::class, 'categoria_tercero');
    }

    /**
     * Relación one-to-many con Referencias
     */
    public function referencias(): HasMany
    {
        return $this->hasMany(Referencia::class);
    }
}
