<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Referencia
 *
 * Transforma los datos de referencias en una respuesta JSON estructurada.
 *
 * @property \App\Models\Referencia $resource
 */
class ReferenciaResource extends JsonResource
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
            'referencia' => $this->referencia,
            'marca_id' => $this->marca_id,
            'comentario' => $this->comentario,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'marca' => $this->whenLoaded('marca'),
            'articulos' => $this->whenLoaded('articulos'),
            'categoria' => $this->whenLoaded('categoria'),
        ];
    }
}
