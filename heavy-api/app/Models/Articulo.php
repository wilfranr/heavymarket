<?php

namespace App\Models;

use App\Traits\NormalizesResources;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Articulo extends Model
{
    use HasFactory, NormalizesResources;

    protected $fillable = [
        'definicion',
        'comentarios',
        'descripcionEspecifica',
        'peso',
        'fotoDescriptiva',
        'foto_medida',
    ];

    protected $casts = [
        'peso' => 'float',
    ];

    protected $normalizableAttributes = [
        'definicion' => 'title',
        'comentarios' => 'sentence',
        'descripcionEspecifica' => 'sentence',
    ];

    public function getFotoDescriptivaAttribute($value): ?string
    {
        if (! $value || str_starts_with($value, 'http')) {
            return $value;
        }

        // Si ya tiene una ruta (contiene /) y no empieza con la ruta legada, asumimos que es una ruta directa desde public/storage
        if (str_contains($value, '/')) {
            return asset("storage/{$value}");
        }

        return asset("storage/Aplicativo/05. Articulos/{$value}");
    }

    public function getFotoMedidaAttribute($value): ?string
    {
        if (! $value || str_starts_with($value, 'http')) {
            return $value;
        }

        // Si ya tiene una ruta (contiene /) y no empieza con la ruta legada, asumimos que es una ruta directa desde public/storage
        if (str_contains($value, '/')) {
            return asset("storage/{$value}");
        }

        return asset("storage/Aplicativo/06. Tipos de Medida/{$value}");
    }

    public function articuloReferencia(): HasMany
    {
        return $this->hasMany(ArticuloReferencia::class, 'articulo_id');
    }

    public function medidas()
    {
        return $this->hasMany(Medida::class);
    }

    public function piezaEstandar(): BelongsTo
    {
        return $this->belongsTo(Lista::class, 'definicion', 'nombre')
            ->where('tipo', 'Piezas Estandar');
    }

    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class);
    }

    public function articuloJuegos(): HasMany
    {
        return $this->hasMany(ArticuloJuego::class);
    }

    // public function listas(): BelongsTo
    // {
    //     // Reference to the listas table
    //     return $this->belongsTo(Lista::class, 'tipo')->where('tipo', "Definición de artículo");
    // }

    public function referencias()
    {
        return $this->belongsToMany(
            Referencia::class,
            'articulos_referencias',
            'articulo_id',
            'referencia_id'
        );
    }

    public function referenciasDirectas(): HasMany
    {
        return $this->hasMany(Referencia::class, 'articulo_id');
    }

    /**
     * Artículos generados desde el catálogo de listas tipo «Piezas Estandar» / «Piezas Estándar».
     */
    public static function comentariosIndicanPiezaEstandar(?string $comentarios): bool
    {
        if ($comentarios === null || trim($comentarios) === '') {
            return false;
        }

        $n = mb_strtolower($comentarios, 'UTF-8');

        return str_contains($n, 'piezas estándar')
            || str_contains($n, 'pieza estándar')
            || str_contains($n, 'piezas estandar')
            || str_contains($n, 'pieza estandar');
    }

    public function getEsPiezaEstandarAttribute(): bool
    {
        return self::comentariosIndicanPiezaEstandar(is_string($this->comentarios) ? $this->comentarios : null);
    }
}
