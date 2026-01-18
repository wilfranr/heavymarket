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
    ];

    public function cotizacion()
    {
        return $this->belongsTo(Cotizacion::class);
    }

    public function pedidoReferenciaProveedor()
    {
        return $this->belongsTo(PedidoReferenciaProveedor::class);
    }
}
