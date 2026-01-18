<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cotizacion extends Model
{
    use HasFactory;

    protected $table = 'cotizaciones';

    protected $fillable = ['tercero_id', 'pedido_id', 'estado'];

    public function tercero()
    {
        return $this->belongsTo(Tercero::class);
    }

    public function pedido()
    {
        return $this->belongsTo(Pedido::class);
    }

}
