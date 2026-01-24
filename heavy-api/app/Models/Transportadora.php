<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo Transportadora
 *
 * Representa una empresa transportadora que puede ser utilizada
 * para envíos y entregas.
 *
 * @property int $id
 * @property string $nombre
 * @property string|null $nit
 * @property string|null $telefono
 * @property string|null $direccion
 * @property int|null $city_id
 * @property int|null $state_id
 * @property int|null $country_id
 * @property string|null $email
 * @property string|null $contacto
 * @property string|null $celular
 * @property string|null $observaciones
 * @property string|null $logo
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\City|null $city
 * @property-read \App\Models\State|null $state
 * @property-read \App\Models\Country|null $country
 */
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

    /**
     * Relación con City
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /**
     * Relación con State
     */
    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class);
    }

    /**
     * Relación con Country
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }
}
