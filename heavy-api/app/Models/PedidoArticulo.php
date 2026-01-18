<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PedidoArticulo extends Model
{
    use HasFactory;

    protected $fillable = [
        'pedido_id',
        'articulo_id',
        'cantidad',
        'comentario',
        'sistema_id',
        'imagen',
    ]; 
}
