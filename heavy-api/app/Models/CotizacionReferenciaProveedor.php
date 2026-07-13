<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CotizacionReferenciaProveedor extends Model
{
    use HasFactory;

    protected $table = 'cotizacion_referencia_proveedores';

    protected $fillable = [
        'cotizacion_id',
        'pedido_referencia_proveedor_id',
        'mostrar_referencia',
        'snapshot_referencia',
        'snapshot_descripcion',
        'snapshot_marca_id',
        'snapshot_marca',
        'snapshot_proveedor_id',
        'snapshot_proveedor_nombre',
        'snapshot_entrega',
        'snapshot_cantidad',
        'snapshot_valor_unidad',
        'snapshot_valor_total',
    ];


    protected function casts(): array
    {
        return [
            'mostrar_referencia' => 'boolean',
            'snapshot_marca_id' => 'integer',
            'snapshot_proveedor_id' => 'integer',
            'snapshot_cantidad' => 'integer',
            'snapshot_valor_unidad' => 'decimal:2',
            'snapshot_valor_total' => 'decimal:2',
        ];
    }

    public function cotizacion()
    {
        return $this->belongsTo(Cotizacion::class);
    }

    public function pedidoReferenciaProveedor()
    {
        return $this->belongsTo(PedidoReferenciaProveedor::class);
    }
}
