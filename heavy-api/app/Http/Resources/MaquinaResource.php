<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Máquina
 *
 * Transforma los datos de máquinas en una respuesta JSON estructurada.
 *
 * @property \App\Models\Maquina $resource
 */
class MaquinaResource extends JsonResource
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
            'tipo' => $this->tipo,
            'modelo' => $this->modelo,
            'fabricante_id' => $this->fabricante_id,
            'serie' => $this->serie,
            'arreglo' => $this->arreglo,
            'foto' => $this->foto,
            'fotoId' => $this->fotoId,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'fabricante' => $this->whenLoaded('fabricantes'),
            'tipoLista' => $this->whenLoaded('listas'),
        ];
    }
}
