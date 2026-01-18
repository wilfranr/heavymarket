<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PedidoReferenciaProveedor extends Model
{
    use HasFactory;

    protected $table = 'pedido_referencia_proveedor';

    protected $fillable = [
        'pedido_referencia_id',
        'referencia_id',
        'tercero_id',
        'marca_id',
        'dias_entrega',
        'costo_unidad',
        'utilidad',
        'valor_unidad',
        'valor_total',
        'ubicacion',
        'estado',
        'cantidad',
    ];

    public function pedidoReferencia()
    {
        return $this->belongsTo(PedidoReferencia::class, 'pedido_referencia_id');
    }

    public function referencia()
    {
        return $this->belongsTo(Referencia::class);
    }

    public function tercero()
    {
        return $this->belongsTo(Tercero::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            // Si no tenemos los IDs necesarios, intentar obtenerlos de la relación
            if (empty($model->referencia_id) && $model->pedidoReferencia) {
                $model->referencia_id = $model->pedidoReferencia->referencia_id;
            }
            
            // Si aún no tenemos los IDs, intentar obtenerlos de la solicitud
            if (empty($model->referencia_id)) {
                $model->referencia_id = request()->input('referencia_id') ?? 
                                     session('current_referencia_id') ?? 
                                     request()->input('referencia_id');
            }
            
            if (empty($model->pedido_referencia_id)) {
                $model->pedido_referencia_id = request()->input('pedido_referencia_id') ?? 
                                             session('current_pedido_referencia_id') ?? 
                                             request()->input('pedido_referencia_id');
            }
            
            // Si aún no tenemos los IDs, lanzar una excepción con un mensaje claro
            if (empty($model->referencia_id) || empty($model->pedido_referencia_id)) {
                throw new \RuntimeException('No se pudo determinar la referencia o el pedido referencia. Asegúrate de que los IDs estén siendo proporcionados correctamente.');
            }
        });
    }
}
