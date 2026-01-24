<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Empresa
 *
 * Transforma los datos de empresas en una respuesta JSON estructurada.
 *
 * @property \App\Models\Empresa $resource
 */
class EmpresaResource extends JsonResource
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
            'siglas' => $this->siglas,
            'direccion' => $this->direccion,
            'telefono' => $this->telefono,
            'celular' => $this->celular,
            'email' => $this->email,
            'nit' => $this->nit,
            'representante' => $this->representante,
            'country_id' => $this->country_id,
            'state_id' => $this->state_id,
            'city_id' => $this->city_id,
            'estado' => $this->estado,
            'flete' => $this->flete,
            'trm' => $this->trm,
            'logo_light' => $this->logo_light,
            'logo_dark' => $this->logo_dark,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'country' => $this->whenLoaded('country'),
            'state' => $this->whenLoaded('states'),
            'city' => $this->whenLoaded('city'),
        ];
    }
}
