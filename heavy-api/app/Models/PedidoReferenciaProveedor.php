<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class PedidoReferenciaProveedor extends Model
{
    use HasFactory;

    protected $table = 'pedido_referencia_proveedor';

    protected $fillable = [
        'pedido_referencia_id',
        'referencia_id',
        'proveedor_id',
        'marca_id',
        'dias_entrega',
        'costo_unidad',
        'utilidad',
        'valor_unidad',
        'valor_total',
        'ubicacion',
        'estado',
        'cantidad',
        'Entrega',
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
        return $this->belongsTo(Tercero::class, 'proveedor_id');
    }

    public function marca()
    {
        return $this->belongsTo(Lista::class, 'marca_id');
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
            if (empty($model->pedido_referencia_id)) {
                throw new \RuntimeException('No se pudo determinar el pedido referencia. Asegúrate de que el ID esté siendo proporcionado correctamente.');
            }

            // Si referencia_id es null, intentar recuperarlo del padre si existe
            // Laravel 13: Usar query builder directo en lugar de instanciar modelo dentro de boot
            if (empty($model->referencia_id) && $model->pedido_referencia_id) {
                $padreRefId = DB::table('pedido_referencia')
                    ->where('id', $model->pedido_referencia_id)
                    ->value('referencia_id');

                if ($padreRefId) {
                    $model->referencia_id = $padreRefId;
                }
            }
        });
    }
}
