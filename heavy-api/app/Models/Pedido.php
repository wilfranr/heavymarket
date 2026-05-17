<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PedidoEstado;
use App\Enums\PedidoOrigen;
use App\Traits\TransicionesEstado;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Pedido - Gestiona los pedidos principales del sistema CYH
 */
class Pedido extends Model
{
    use HasFactory, TransicionesEstado;

    protected $table = 'pedidos';

    protected $fillable = [
        'user_id',
        'origen',
        'tercero_id',
        'direccion',
        'comentario',
        'contacto_id',
        'maquina_id',
        'fabricante_id',
        'estado',
        'motivo_rechazo',
        'comentarios_rechazo',
    ];

    protected $casts = [
        'origen' => PedidoOrigen::class,
        'comentario' => 'array',
        'comentarios_rechazo' => 'array',
    ];

    protected $attributes = [
        'origen' => 'panel',
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

    public function esDeLanding(): bool
    {
        return $this->origen === PedidoOrigen::Landing;
    }

    public function esVisibleParaVendedor(User $vendedor): bool
    {
        return $this->user_id === $vendedor->id || $this->esDeLanding();
    }

    /**
     * @param  Builder<Pedido>  $query
     * @return Builder<Pedido>
     */
    public function scopeVisibleParaVendedor(Builder $query, User $vendedor): Builder
    {
        return $query->where(function (Builder $q) use ($vendedor) {
            $q->where('user_id', $vendedor->id)
                ->orWhere('origen', PedidoOrigen::Landing->value);
        });
    }
}
