<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PedidoReferencia extends Model
{
    use HasFactory;

    protected $table = 'pedido_referencia';

    protected $fillable = [
        'pedido_id',
        'referencia_id',
        'sistema_id',
        'lista_id',
        'categoria_comercial_id',
        'marca_id',
        'definicion',
        'cantidad',
        'comentario',
        'imagen',
        'mostrar_referencia',
        'estado',
    ];

    public function pedido()
    {
        return $this->belongsTo(Pedido::class);
    }

    public function referencia(): BelongsTo
    {
        return $this->belongsTo(Referencia::class);
    }

    public function sistema(): BelongsTo
    {
        return $this->belongsTo(Sistema::class);
    }

    public function lista(): BelongsTo
    {
        return $this->belongsTo(Lista::class, 'lista_id');
    }

    public function categoriaComercial(): BelongsTo
    {
        return $this->belongsTo(Lista::class, 'categoria_comercial_id');
    }

    public function categoriasComerciales(): BelongsToMany
    {
        return $this->belongsToMany(
            Lista::class,
            'analysis_commercial_categories',
            'pedido_referencia_id',
            'categoria_comercial_id'
        )->withTimestamps();
    }

    public function marca(): BelongsTo
    {
        return $this->belongsTo(Lista::class, 'marca_id');
    }

    public function imagenes(): HasMany
    {
        return $this->hasMany(PedidoReferenciaImagen::class, 'pedido_referencia_id');
    }

    public function proveedores(): HasMany
    {
        // Aunque el campo se llama 'pedido_id', en realidad es el id de 'pedido_referencia'
        return $this->hasMany(PedidoReferenciaProveedor::class, 'pedido_referencia_id', 'id');
    }

    /**
     * Referencias que coinciden con la especialidad del proveedor: por marca,
     * por categoria comercial principal o por las categorias multiples del analisis.
     * Fuente unica del matching para el listado de oportunidades y la validacion del costeo.
     *
     * @param  Builder<PedidoReferencia>  $query
     * @return Builder<PedidoReferencia>
     */
    public function scopeCoincideConProveedor(Builder $query, Tercero $proveedor): Builder
    {
        $marcas = $proveedor->fabricantes()->pluck('lista_id')->all();
        $categorias = $proveedor->categoriasComerciales()->pluck('lista_id')->all();

        return $query->where(function (Builder $q) use ($marcas, $categorias) {
            $q->whereIn('marca_id', $marcas)
                ->orWhereIn('categoria_comercial_id', $categorias)
                ->orWhereHas('categoriasComerciales', function (Builder $sub) use ($categorias) {
                    $sub->whereIn('listas.id', $categorias);
                });
        });
    }

    /**
     * Cantidad de entradas de comentario almacenadas en el campo JSON / texto legacy
     * (misma semántica que el parseo en el frontend de análisis).
     */
    public function comentariosRegistrosCount(): int
    {
        $raw = $this->comentario;
        if ($raw === null || $raw === '') {
            return 0;
        }
        $trimmed = trim((string) $raw);
        if ($trimmed === '' || $trimmed === 'Sin comentario adicional') {
            return 0;
        }
        $decoded = json_decode($trimmed, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $n = 0;
            foreach ($decoded as $c) {
                if (is_array($c) && isset($c['comentario']) && is_string($c['comentario'])) {
                    $n++;
                }
            }

            return $n;
        }

        return 1;
    }

    /**
     * Registros en pedido_referencia_imagen más imagen principal legacy en columna `imagen`.
     */
    public function imagenesRegistrosCount(): int
    {
        if (array_key_exists('imagenes_count', $this->attributes)) {
            $n = (int) $this->attributes['imagenes_count'];
        } elseif ($this->relationLoaded('imagenes')) {
            $n = $this->imagenes->count();
        } else {
            $n = (int) $this->imagenes()->count();
        }

        $legacy = $this->imagen;
        if (is_string($legacy) && trim($legacy) !== '') {
            $n++;
        }

        return $n;
    }
}
