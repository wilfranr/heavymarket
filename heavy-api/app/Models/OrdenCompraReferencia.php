<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrdenCompraReferencia extends Model
{
    protected $table = 'orden_compra_referencia';

    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'orden_compra_id',
        'referencia_id',
        'cantidad',
        'cantidad_recibida',
        'valor_unitario',
        'valor_total',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'cantidad_recibida' => 'integer',
        'valor_unitario' => 'decimal:2',
        'valor_total' => 'decimal:2',
    ];

    public function ordenCompra(): BelongsTo
    {
        return $this->belongsTo(OrdenCompra::class);
    }

    public function referencia(): BelongsTo
    {
        return $this->belongsTo(Referencia::class);
    }

    public function recepcionDetalles(): HasMany
    {
        return $this->hasMany(RecepcionCompraDetalle::class, 'orden_compra_detalle_id');
    }
}
