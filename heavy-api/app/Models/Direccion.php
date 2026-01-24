<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo Direccion
 *
 * Representa una dirección asociada a un tercero (cliente/proveedor).
 * Puede tener una dirección principal por tercero.
 *
 * @property int $id
 * @property int $tercero_id
 * @property string $direccion
 * @property int|null $city_id
 * @property int|null $state_id
 * @property int|null $country_id
 * @property bool $principal
 * @property string|null $destinatario
 * @property string|null $nit_cc
 * @property int|null $transportadora_id
 * @property string|null $forma_pago
 * @property string|null $telefono
 * @property string|null $ciudad_texto
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Tercero $tercero
 * @property-read \App\Models\Country|null $country
 * @property-read \App\Models\City|null $city
 * @property-read \App\Models\State|null $state
 * @property-read \App\Models\Transportadora|null $transportadora
 */
class Direccion extends Model
{
    use HasFactory;

    protected $table = 'direcciones';

    protected $fillable = [
        'tercero_id',
        'direccion',
        'city_id',
        'state_id',
        'country_id',
        'principal',
        'destinatario',
        'nit_cc',
        'transportadora_id',
        'forma_pago',
        'telefono',
        'ciudad_texto',
    ];

    protected $casts = [
        'principal' => 'boolean',
    ];

    /**
     * Relación con Tercero
     */
    public function tercero(): BelongsTo
    {
        return $this->belongsTo(Tercero::class, 'tercero_id');
    }

    /**
     * Relación con Country
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    /**
     * Relación con City
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class, 'city_id');
    }

    /**
     * Relación con State
     */
    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class, 'state_id');
    }

    /**
     * Relación con Transportadora
     */
    public function transportadora(): BelongsTo
    {
        return $this->belongsTo(Transportadora::class, 'transportadora_id');
    }

    /**
     * Boot del modelo - Lógica al guardar
     */
    protected static function booted(): void
    {
        static::saving(function ($direccion) {
            if ($direccion->principal) {
                // Si esta dirección está marcada como principal, desmarca las demás del mismo tercero
                $direccion->tercero->direcciones()
                    ->where('id', '!=', $direccion->id)
                    ->update(['principal' => false]);
            }
        });
    }
}
