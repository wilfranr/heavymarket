<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transportadora extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'nit',
        'telefono',
        'direccion',
        'city_id',
        'state_id',
        'country_id',
        'email',
        'contacto',
        'celular',
        'observaciones',
        'logo',
    ];

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function state()
    {
        return $this->belongsTo(State::class);
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

}
