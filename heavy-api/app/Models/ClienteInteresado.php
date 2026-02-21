<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClienteInteresado extends Model
{
    protected $fillable = [
        'nombre_completo',
        'empresa',
        'correo_electronico',
        'telefono',
        'motivo_consulta',
        'acepta_tratamiento_datos',
        'estado',
    ];

    protected $casts = [
        'acepta_tratamiento_datos' => 'boolean',
    ];
}
