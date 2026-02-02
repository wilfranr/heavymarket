<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Pedido - Gestiona los pedidos principales del sistema CYH
 */
class Pedido extends Model
{
    use HasFactory;

    protected $table = 'pedidos';

    protected $fillable = [
        'user_id',
        'tercero_id',
        'direccion',
        'comentario',
        'contacto_id',
        'maquina_id',
        'fabricante_id',
        'estado',
        'motivo_rechazo',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tercero(): BelongsTo
    {
        return $this->belongsTo(Tercero::class);
    }

    public function maquina(): BelongsTo
    {
        return $this->belongsTo(Maquina::class);
    }

    public function fabricante(): BelongsTo
    {
        return $this->belongsTo(Fabricante::class);
    }

    public function contacto(): BelongsTo
    {
        return $this->belongsTo(Contacto::class);
    }

    public function referencias(): HasMany
    {
        return $this->hasMany(PedidoReferencia::class);
    }

    public function articulos(): HasMany
    {
        return $this->hasMany(PedidoArticulo::class);
    }

    public function referenciasProveedor(): HasMany
    {
        return $this->hasMany(PedidoReferenciaProveedor::class);
    }
}
