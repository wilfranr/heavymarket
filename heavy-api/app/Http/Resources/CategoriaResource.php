<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Categoria
 *
 * Transforma los datos de categorías en una respuesta JSON estructurada.
 *
 * @property \App\Models\Categoria $resource
 */
class CategoriaResource extends JsonResource
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
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'terceros' => $this->whenLoaded('terceros'),
            'referencias' => $this->whenLoaded('referencias'),
        ];
    }
}
