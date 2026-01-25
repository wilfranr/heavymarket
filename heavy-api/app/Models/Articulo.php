<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Articulo extends Model
{
    use HasFactory;

    protected $fillable = [
        'definicion',
        'comentarios',
        'descripcionEspecifica',
        'peso',
        'fotoDescriptiva',
        'foto_medida',
    ];

    public function getFotoDescriptivaAttribute($value): ?string
    {
        if (!$value || str_starts_with($value, 'http')) {
            return $value;
        }

        return asset("storage/Aplicativo/05. Articulos/{$value}");
    }

    public function getFotoMedidaAttribute($value): ?string
    {
        if (!$value || str_starts_with($value, 'http')) {
            return $value;
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
}