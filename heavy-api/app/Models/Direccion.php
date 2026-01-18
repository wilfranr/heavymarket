<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Direccion extends Model
{
    use HasFactory;

    protected $table = 'direcciones';

    protected $fillable = [
        'tercero_id',
        'direccion', // dirección física
        'city_id',
        'state_id',
        'country_id',
        'principal', // si es la dirección principal
        'destinatario', // nombre del destinatario
        'nit_cc', // NIT o CC del destinatario
        'transportadora_id', // ID de la transportadora
        'forma_pago', // forma de pago
        'telefono', // teléfono de contacto
        'ciudad_texto' // ciudad en texto (alternativo a city_id)
    ];
    
    public function tercero()
    {
        return $this->belongsTo(Tercero::class, 'tercero_id');
    }

    public function country()
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    public function city()
    {
        return $this->belongsTo(City::class, 'city_id');
    }

    public function state()
    {
        return $this->belongsTo(State::class, 'state_id');
    }
    
    public function transportadora()
    {
        return $this->belongsTo(Transportadora::class, 'transportadora_id');
    }
    protected static function booted()
    {
        static::saving(function ($direccion) {
            if ($direccion->principal) {
                // Si este direccion está marcado como principal, desmarca los demás
                $direccion->tercero->direcciones()
                    ->where('id', '!=', $direccion->id)
                    ->update(['principal' => false]);
            }
        });
    }
    
}