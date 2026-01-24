<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Transportadora
 *
 * Transforma los datos de transportadoras en una respuesta JSON estructurada.
 *
 * @property \App\Models\Transportadora $resource
 */
class TransportadoraResource extends JsonResource
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
            'nombre' => $this->nombre,
            'nit' => $this->nit,
            'telefono' => $this->telefono,
            'direccion' => $this->direccion,
            'city_id' => $this->city_id,
            'state_id' => $this->state_id,
            'country_id' => $this->country_id,
            'email' => $this->email,
            'contacto' => $this->contacto,
            'celular' => $this->celular,
            'observaciones' => $this->observaciones,
            'logo' => $this->logo,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'city' => $this->whenLoaded('city'),
            'state' => $this->whenLoaded('state'),
            'country' => $this->whenLoaded('country'),
        ];
    }
}
