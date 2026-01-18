<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Juego extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
    ];

    public function articuloJuegos()
    {
        return $this->hasMany(ArticuloJuego::class);
    }
}
