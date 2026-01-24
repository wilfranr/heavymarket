<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Direccion
 *
 * Transforma los datos de direcciones en una respuesta JSON estructurada.
 *
 * @property \App\Models\Direccion $resource
 */
class DireccionResource extends JsonResource
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
            'direccion' => $this->direccion,
            'city_id' => $this->city_id,
            'state_id' => $this->state_id,
            'country_id' => $this->country_id,
            'principal' => $this->principal,
            'destinatario' => $this->destinatario,
            'nit_cc' => $this->nit_cc,
            'transportadora_id' => $this->transportadora_id,
            'forma_pago' => $this->forma_pago,
            'telefono' => $this->telefono,
            'ciudad_texto' => $this->ciudad_texto,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'tercero' => $this->whenLoaded('tercero'),
            'country' => $this->whenLoaded('country'),
            'city' => $this->whenLoaded('city'),
            'state' => $this->whenLoaded('state'),
            'transportadora' => $this->whenLoaded('transportadora'),
        ];
    }
}
