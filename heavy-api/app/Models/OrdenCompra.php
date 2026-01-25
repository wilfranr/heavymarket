<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\OrdenCompraReferencia;

/**
 * Modelo OrdenCompra
 *
 * Representa una orden de compra generada a partir de un pedido o cotización.
 * Una orden de compra puede tener múltiples referencias asociadas.
 *
 * @property int $id
 * @property int|null $user_id
 * @property int|null $tercero_id
 * @property int|null $pedido_id
 * @property int|null $cotizacion_id
 * @property int $proveedor_id
 * @property string|null $estado
 * @property int|null $pedido_referencia_id
 * @property \Illuminate\Support\Carbon|null $fecha_expedicion
 * @property \Illuminate\Support\Carbon|null $fecha_entrega
 * @property string|null $observaciones
 * @property int|null $cantidad
 * @property string|null $direccion
 * @property string|null $telefono
 * @property float|null $valor_unitario
 * @property float|null $valor_total
 * @property float|null $valor_iva
 * @property float|null $valor_descuento
 * @property string|null $guia
 * @property string|null $color
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \App\Models\User|null $user
 * @property-read \App\Models\Tercero|null $tercero
 * @property-read \App\Models\Tercero $proveedor
 * @property-read \App\Models\Pedido|null $pedido
 * @property-read \App\Models\Cotizacion|null $cotizacion
 * @property-read \App\Models\PedidoReferencia|null $pedidoReferencia
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\Referencia[] $referencias
 */
class OrdenCompra extends Model
{
    use HasFactory;

    protected $table = 'orden_compras';

    protected $fillable = [
        'user_id',
        'tercero_id',
        'pedido_id',
        'cotizacion_id',
        'proveedor_id',
        'estado',
        'pedido_referencia_id',
        'fecha_expedicion',
        'fecha_entrega',
        'observaciones',
        'cantidad',
        'direccion',
        'telefono',
        'valor_unitario',
        'valor_total',
        'valor_iva',
        'valor_descuento',
        'guia',
        'color',
    ];

    protected $casts = [
        'fecha_expedicion' => 'datetime',
        'fecha_entrega' => 'datetime',
        'cantidad' => 'integer',
        'valor_unitario' => 'decimal:2',
        'valor_total' => 'decimal:2',
        'valor_iva' => 'decimal:2',
        'valor_descuento' => 'decimal:2',
    ];

    /**
     * Relación con el usuario que creó la orden
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con el tercero (cliente)
     *
     * @return BelongsTo
     */
    public function tercero(): BelongsTo
    {
        return $this->belongsTo(Tercero::class);
    }

    /**
     * Relación con el proveedor (también es un Tercero)
     *
     * @return BelongsTo
     */
    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Tercero::class, 'proveedor_id');
    }

    /**
     * Relación con el pedido origen
     *
     * @return BelongsTo
     */
    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }

    /**
     * Relación con la cotización origen
     *
     * @return BelongsTo
     */
    public function cotizacion(): BelongsTo
    {
        return $this->belongsTo(Cotizacion::class, 'cotizacion_id');
    }

    /**
     * Relación con la referencia del pedido
     *
     * @return BelongsTo
     */
    public function pedidoReferencia(): BelongsTo
    {
        return $this->belongsTo(PedidoReferencia::class);
    }

    /**
     * Relación many-to-many con Referencias
     *
     * @return BelongsToMany
     */
    public function referencias(): BelongsToMany
    {
        return $this->belongsToMany(Referencia::class, 'orden_compra_referencia')
            ->using(OrdenCompraReferencia::class)
            ->withPivot('cantidad', 'valor_unitario', 'valor_total')
            ->withTimestamps();
    }

    /**
     * Agregar una referencia a la orden de compra
     *
     * @param int $referenciaId
     * @param int $cantidad
     * @param float $valorUnitario
     * @param float $valorTotal
     * @return void
     */
    public function addReferencia(int $referenciaId, int $cantidad, float $valorUnitario, float $valorTotal): void
    {
        $this->referencias()->attach($referenciaId, [
            'cantidad' => $cantidad,
            'valor_unitario' => $valorUnitario,
            'valor_total' => $valorTotal,
        ]);
    }

    /**
     * Obtener el total de todas las referencias
     *
     * @return float
     */
    public function getTotalReferencias(): float
    {
        return (float) $this->referencias()->sum('valor_total');
    }
}
