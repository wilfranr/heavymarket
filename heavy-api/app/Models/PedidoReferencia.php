<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PedidoReferencia extends Model
{
    use HasFactory;

    protected $table = 'pedido_referencia';

    protected $fillable = [
        'pedido_id',
        'referencia_id',
        'sistema_id',
        'marca_id',
        'definicion',
        'cantidad',
        'comentario',
        'imagen',
        'mostrar_referencia',
        'estado'
    ];

    public function pedido()
    {
        return $this->belongsTo(Pedido::class);
    }



    public function referencia(): BelongsTo
    {
        return $this->belongsTo(Referencia::class);
    }

    public function proveedores(): HasMany
    {
        // Aunque el campo se llama 'pedido_id', en realidad es el id de 'pedido_referencia'
        return $this->hasMany(PedidoReferenciaProveedor::class, 'pedido_referencia_id', 'id');
    }
}