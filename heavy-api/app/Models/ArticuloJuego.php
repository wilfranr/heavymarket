<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArticuloJuego extends Model
{
    use HasFactory;

    protected $fillable = [
        'articulo_id',
        'referencia_id',
        'cantidad',
        'comentario',
    ];

    public function articulo()
    {
        return $this->belongsTo(Articulo::class, 'articulo_id');
    }

    public function referencia()
    {
        return $this->belongsTo(Referencia::class, 'referencia_id');
    }
}