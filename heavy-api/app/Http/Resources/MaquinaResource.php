<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            // Nombre del OEM (misma clave que en PedidoResource.maquina para el front)
            'marca' => $this->relationLoaded('fabricante')
                ? ($this->fabricante?->nombre ?? 'N/A')
                : null,
            'fabricante_id' => $this->fabricante_id,
            'serie' => $this->serie,
            'arreglo' => $this->arreglo,
            'foto' => $this->foto && ! filter_var($this->foto, FILTER_VALIDATE_URL) ? Storage::disk('public')->url($this->foto) : $this->foto,
            'fotoId' => $this->fotoId && ! filter_var($this->fotoId, FILTER_VALIDATE_URL) ? Storage::disk('public')->url($this->fotoId) : $this->fotoId,
            'imagen_url' => $this->imagen_url,
            'imagen_placa_url' => $this->imagen_placa_url,
            'estado_revision' => $this->estado_revision,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'fabricante' => $this->whenLoaded('fabricante'),
            'tipoLista' => $this->whenLoaded('listas'),
            'componentes' => ComponenteMaquinaResource::collection($this->whenLoaded('componentes')),
        ];
    }
}
