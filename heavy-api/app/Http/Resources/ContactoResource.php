<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Contacto
 *
 * Transforma los datos de contactos en una respuesta JSON estructurada.
 *
 * @property \App\Models\Contacto $resource
 */
class ContactoResource extends JsonResource
{
    /**
     * Transforma el recurso en un array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tercero_id' => $this->tercero_id,
            'nombre' => $this->nombre,
            'cargo' => $this->cargo,
            'telefono' => $this->telefono,
            'indicativo' => $this->indicativo,
            'country_id' => $this->country_id,
            'email' => $this->email,
            'principal' => $this->principal,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'tercero' => $this->whenLoaded('tercero'),
            'country' => $this->whenLoaded('country'),
        ];
    }
}
