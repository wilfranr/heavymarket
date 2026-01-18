<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArticuloReferencia extends Model
{
    use HasFactory;

    protected $table = 'articulos_referencias';

    protected $fillable = [
        'articulo_id',
        'referencia_id',
    ];

    public function referencia()
    {
        return $this->belongsTo(Referencia::class, 'referencia_id');
    }

    public function articulo()
    {
        return $this->belongsTo(Articulo::class, 'articulo_id');
    }
}
