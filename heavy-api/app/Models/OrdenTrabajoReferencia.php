<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrdenTrabajoReferencia extends Model
{
    use HasFactory;

    protected $fillable = [
        'orden_trabajo_id',
        'pedido_referencia_id',
        'cantidad_cotizada',
        'cantidad_recibida',
        'cantidad_depurada',
        'motivo_depuracion',
        'depurado_por',
        'depurado_at',
        'estado',
        'recibido',
        'fecha_recepcion',
        'observaciones',
    ];

    protected $casts = [
        'cantidad_cotizada' => 'integer',
        'cantidad_recibida' => 'integer',
        'cantidad_depurada' => 'integer',
        'recibido' => 'boolean',
        'depurado_at' => 'datetime',
    ];

    // relación con orden de trabajo
    public function ordenTrabajo()
    {
        return $this->belongsTo(OrdenTrabajo::class);
    }

    public function depuradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'depurado_por');
    }

    // relación  con PedidoReferencia
    public function pedidoReferencia()
    {
        return $this->belongsTo(PedidoReferencia::class, 'pedido_referencia_id');
    }

    //  Acceso rápido a la referencia base
    public function referencia()
    {
        return $this->hasOneThrough(
            Referencia::class,
            PedidoReferencia::class,
            'id', // Foreign key en PedidoReferencia
            'id', // Foreign key en Referencia
            'pedido_referencia_id', // Local key en esta tabla
            'referencia_id' // Foreign en PedidoReferencia
        );
    }
}
