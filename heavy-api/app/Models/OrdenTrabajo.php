<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrdenTrabajo extends Model
{
    use HasFactory;

    protected $fillable = [
        'tercero_id',
        'pedido_id',
        'cotizacion_id',
        'estado',
        'fecha_ingreso',
        'fecha_entrega',
        'direccion_id',
        'telefono',
        'observaciones',
        'guia',
        'transportadora_id',
        'archivo',
        'motivo_cancelacion',
    ];

    public function tercero()
    {
        return $this->belongsTo(Tercero::class);
    }

    public function pedido()
    {
        return $this->belongsTo(Pedido::class);
    }

    public function cotizacion()
    {
        return $this->belongsTo(Cotizacion::class);
    }

    public function transportadora()
    {
        return $this->belongsTo(Transportadora::class);
    }

    public function referencias()
    {
        return $this->hasMany(OrdenTrabajoReferencia::class);
    }

    public function direccion()
    {
        return $this->belongsTo(Direccion::class);
    }
}
