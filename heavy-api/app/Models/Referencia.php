<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Referencia - Gestiona las referencias de artículos en el sistema CYH
 *
 * Este modelo representa una referencia o código de artículo que puede estar
 * asociada a múltiples artículos, categorías y pedidos. Es el identificador
 * principal para la gestión de inventario y cotizaciones.
 *
 * @property int $id Identificador único de la referencia
 * @property string $referencia Código o número de referencia del artículo
 * @property int|null $marca_id ID de la marca asociada a la referencia
 * @property string|null $comentario Comentarios adicionales sobre la referencia
 * @property \Carbon\Carbon $created_at Fecha de creación de la referencia
 * @property \Carbon\Carbon $updated_at Fecha de última actualización
 * @property-read Lista $marca Marca asociada a la referencia
 * @property-read Categoria $categoria Categoría de la referencia
 * @property-read \Illuminate\Database\Eloquent\Collection|Articulo[] $articulos Artículos asociados a la referencia
 * @property-read \Illuminate\Database\Eloquent\Collection|ArticuloReferencia[] $articuloReferencia Relación pivot con artículos
 * @property-read \Illuminate\Database\Eloquent\Collection|Pedido[] $pedidos Pedidos que incluyen esta referencia
 * @property-read \Illuminate\Database\Eloquent\Collection|ArticuloJuego[] $articuloJuegos Juegos de artículos asociados
 *
 * @since 1.0.0
 *
 * @author Sistema CYH
 */
class Referencia extends Model
{
    use \App\Traits\NormalizesResources, HasFactory;

    /**
     * Los atributos que son asignables masivamente.
     *
     * @var array<string>
     */
    protected $fillable = [
        'id',
        'referencia',    // Código o número de referencia del artículo
        'articulo_id',
        'lista_id',      // ID del tipo de artículo asociado (listas)
        'marca_id',      // ID de la marca asociada a la referencia
        'es_temporal',   // Indica si la referencia es temporal (creada desde landing)
        'comentario',    // Comentarios adicionales sobre la referencia
    ];

    /**
     * El "booted" method del modelo.
     */
    protected static function booted()
    {
        static::created(function ($referencia) {
            if ($referencia->articulo_id) {
                $referencia->articulos()->syncWithoutDetaching([$referencia->articulo_id]);
            }
        });

        static::updated(function ($referencia) {
            if ($referencia->isDirty('articulo_id') && $referencia->articulo_id) {
                $referencia->articulos()->syncWithoutDetaching([$referencia->articulo_id]);
            }
        });
    }

    protected $normalizableAttributes = [
        'referencia' => 'code',
        'comentario' => 'sentence',
    ];

    /**
     * Relación con la tabla pivot de artículos y referencias.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function articuloReferencia()
    {
        return $this->hasMany(ArticuloReferencia::class, 'referencia_id');
    }

    /**
     * Relación con el artículo principal. (Muchas referencias -> 1 Artículo)
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function articulo()
    {
        return $this->belongsTo(Articulo::class, 'articulo_id');
    }

    /**
     * Relación con el tipo de artículo (Lista).
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function lista()
    {
        return $this->belongsTo(Lista::class, 'lista_id');
    }

    /**
     * Relación muchos a muchos con artículos.
     * Una referencia puede estar asociada a múltiples artículos.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function articulos()
    {
        return $this->belongsToMany(
            Articulo::class,
            'articulos_referencias',
            'referencia_id',
            'articulo_id'
        );
    }

    /**
     * Relación con la marca de la referencia.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function marca()
    {
        return $this->belongsTo(Lista::class, 'marca_id')->whereIn('tipo', ['Marca', 'Fabricantes']);
    }

    /**
     * Relación muchos a muchos con pedidos.
     * Una referencia puede estar en múltiples pedidos con cantidades específicas.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function pedidos()
    {
        return $this->belongsToMany(Pedido::class, 'pedido_referencia', 'referencia_id', 'pedido_id')
            ->withPivot('cantidad');
    }

    /**
     * Relación con juegos de artículos asociados a la referencia.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function articuloJuegos()
    {
        return $this->hasMany(ArticuloJuego::class);
    }

    /**
     * Relación con la categoría de la referencia.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    /**
     * Relación con la categoría comercial de la referencia.
     * Apunta a la tabla listas con tipo = 'Categoría Comercial'.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function categoriaComercial()
    {
        return $this->belongsTo(Lista::class, 'lista_id')->where('tipo', 'Categoría Comercial');
    }
}
