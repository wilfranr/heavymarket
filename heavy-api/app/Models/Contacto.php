<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo Contacto
 *
 * Representa un contacto asociado a un tercero (cliente/proveedor).
 * Puede tener un contacto principal por tercero.
 *
 * @property int $id
 * @property int $tercero_id
 * @property string $nombre
 * @property string|null $cargo
 * @property string|null $telefono
 * @property string|null $indicativo
 * @property int|null $country_id
 * @property string|null $email
 * @property bool $principal
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \App\Models\Tercero $tercero
 * @property-read \App\Models\Country|null $country
 */
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

    protected $casts = [
        'principal' => 'boolean',
    ];

    /**
     * Relación con Tercero
     *
     * @return BelongsTo
     */
    public function tercero(): BelongsTo
    {
        return $this->belongsTo(Tercero::class, 'tercero_id');
    }

    /**
     * Relación con Country
     *
     * @return BelongsTo
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    /**
     * Boot del modelo - Lógica al guardar
     */
    protected static function booted(): void
    {
        static::saving(function ($contacto) {
            if ($contacto->principal) {
                // Si este contacto está marcado como principal, desmarca los demás del mismo tercero
                $contacto->tercero->contactos()
                    ->where('id', '!=', $contacto->id)
                    ->update(['principal' => false]);
            }
        });
    }
}
