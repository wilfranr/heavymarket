<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Referencia
 */
class ReferenciaResource extends JsonResource
{
    /**
     * Transforma el recurso en un array.
     * 
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'descripcion' => $this->descripcion,
            'fabricante_id' => $this->fabricante_id,
            'sistema_id' => $this->sistema_id,
            'precio' => $this->precio,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            'fabricante' => $this->whenLoaded('fabricante'),
            'sistema' => $this->whenLoaded('sistema'),
        ];
    }
}
