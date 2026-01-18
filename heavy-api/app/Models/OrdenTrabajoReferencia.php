<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrdenTrabajoReferencia extends Model
{
    use HasFactory;
    protected $fillable = [
        'orden_trabajo_id',
        'pedido_referencia_id',
        'cantidad',
        'cantidad_recibida',
        'estado',
        'recibido',
        'fecha_recepcion',
        'observaciones',
    ];

    //relación con orden de trabajo
    public function ordenTrabajo()
    {
        return $this->belongsTo(OrdenTrabajo::class);
    }

    //relación  con PedidoReferencia
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
