<?php

namespace App\Models;

use App\Traits\NormalizesResources;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Modelo Categoria
 *
 * Representa una categoría de productos que puede estar asociada
 * a múltiples terceros (proveedores) y referencias.
 *
 * @property int $id
 * @property string $nombre
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection|Tercero[] $terceros
 * @property-read Collection|Referencia[] $referencias
 */
class Categoria extends Model
{
    use HasFactory, NormalizesResources;

    protected $fillable = [
        'nombre',
    ];

    protected $normalizableAttributes = [
        'nombre' => 'title',
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
