<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class OrdenCompraReferencia extends Pivot
{
    protected $table = 'orden_compra_referencia';

    protected $fillable = [
        'id',
        'orden_compra_id',
        'referencia_id',
        'cantidad',
        'valor_unitario',
        'valor_total',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'valor_unitario' => 'decimal:2',
        'valor_total' => 'decimal:2',
    ];

    public function ordenCompra()
    {
        return $this->belongsTo(OrdenCompra::class);
    }

    public function referencia()
    {
        return $this->belongsTo(Referencia::class);
    }
}
