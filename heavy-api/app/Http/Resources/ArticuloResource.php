<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Artículo
 *
 * Transforma los datos de artículos en una respuesta JSON estructurada.
 *
 * @property \App\Models\Articulo $resource
 */
class ArticuloResource extends JsonResource
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
            'definicion' => $this->definicion,
            'descripcionEspecifica' => $this->descripcionEspecifica,
            'peso' => $this->peso,
            'comentarios' => $this->comentarios,
            'fotoDescriptiva' => $this->fotoDescriptiva,
            'foto_medida' => $this->foto_medida,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'referencias' => $this->whenLoaded('referencias'),
            'medidas' => $this->whenLoaded('medidas'),
        ];
    }
}
