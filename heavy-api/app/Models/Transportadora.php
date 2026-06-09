<?php

namespace App\Models;

use App\Traits\NormalizesResources;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

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
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read City|null $city
 * @property-read State|null $state
 * @property-read Country|null $country
 */
class Transportadora extends Model
{
    use HasFactory, NormalizesResources;

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

    protected $normalizableAttributes = [
        'nombre' => 'title',
        'direccion' => 'title',
        'observaciones' => 'sentence',
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
