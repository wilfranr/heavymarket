<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\OrdenCompraReferencia;

class OrdenCompra extends Model
{
    use HasFactory;

    protected $fillable = [
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

    public function tercero()
    {
        return $this->belongsTo(Tercero::class);
    }

    public function proveedor()
    {
        return $this->belongsTo(Tercero::class, 'proveedor_id');
    }

    public function pedido()
    {
        return $this->belongsTo(Pedido::class);
    }

    public function cotizacion()
    {
        return $this->belongsTo(Cotizacion::class, 'cotizaciones_id');
    }

    public function referencias()
    {
        return $this->belongsToMany(Referencia::class, 'orden_compra_referencia')
            ->using(OrdenCompraReferencia::class)
            ->withPivot('cantidad', 'valor_unitario', 'valor_total');
    }

    public function pedidoReferencia()
    {
        return $this->belongsTo(PedidoReferencia::class);
    }

    /**
     * Agregar una referencia a la orden de compra
     */
    public function addReferencia($referenciaId, $cantidad, $valorUnitario, $valorTotal)
    {
        $this->referencias()->attach($referenciaId, [
            'cantidad' => $cantidad,
            'valor_unitario' => $valorUnitario,
            'valor_total' => $valorTotal,
        ]);
    }

    /**
     * Obtener el total de todas las referencias
     */
    public function getTotalReferencias()
    {
        return $this->referencias()->sum('valor_total');
    }
}
