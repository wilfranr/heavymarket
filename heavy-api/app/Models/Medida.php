<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medida extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'unidad',
        'valor',
        'tipo',
        'identificador',
        'imagen',
        'articulo_id',
    ];

    public function articulo()
    {
        return $this->belongsTo(Articulo::class);
    }
}
