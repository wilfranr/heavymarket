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
        'es_backorder',
        'costo_unidad',
        'utilidad',
        'valor_unidad',
        'valor_total',
        'ubicacion',
        'estado',
        'cantidad',
        'Entrega',
    ];

    protected function casts(): array
    {
        return [
            'dias_entrega' => 'integer',
            'es_backorder' => 'boolean',
        ];
    }

    public function getEntregaLabelAttribute(): string
    {
        if ($this->es_backorder) {
            return 'Backorder';
        }

        return match ($this->dias_entrega) {
            0 => 'Inmediata',
            1 => '1 día hábil',
            3 => '2 a 3 días hábiles',
            7 => '4 a 7 días hábiles',
            15 => '8 a 15 días hábiles',
            30 => '15 a 30 días hábiles',
            45 => '45 días hábiles',
            60 => '60 días hábiles',
            null => 'Sin definir',
            default => "{$this->dias_entrega} días hábiles",
        };
    }

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
