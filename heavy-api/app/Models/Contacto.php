<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contacto extends Model
{
    use HasFactory;

    protected $fillable = [
        'tercero_id',
        'nombre',
        'cargo',
        'telefono',
        'indicativo',
        'country_id',
        'email',
        'principal',
    ];

    public function tercero()
    {
        return $this->belongsTo(Tercero::class, 'tercero_id');
    }

    public function country()
    {
        return $this->belongsTo(\App\Models\Country::class);
    }


    protected static function booted()
    {
        static::saving(function ($contacto) {
            if ($contacto->principal) {
                // Si este contacto está marcado como principal, desmarca los demás
                $contacto->tercero->contactos()
                    ->where('id', '!=', $contacto->id)
                    ->update(['principal' => false]);
            }
        });
    }
}
