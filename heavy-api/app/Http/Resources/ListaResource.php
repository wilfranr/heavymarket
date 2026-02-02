<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * API Resource para el modelo Lista
 * 
 * Transforma los datos de listas (catálogos) en una respuesta JSON estructurada.
 * 
 * @property \App\Models\Lista $resource
 */
class ListaResource extends JsonResource
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
            'tipo' => $this->tipo,
            'nombre' => $this->nombre,
            'definicion' => $this->definicion,
            'foto' => $this->foto && !filter_var($this->foto, FILTER_VALIDATE_URL) ? Storage::disk('public')->url($this->foto) : ($this->foto ?? asset('images/no-image.png')),
            'fotoMedida' => $this->fotoMedida && !filter_var($this->fotoMedida, FILTER_VALIDATE_URL) ? Storage::disk('public')->url($this->fotoMedida) : $this->fotoMedida,
            'sistema_id' => $this->sistema_id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
            
            // Relaciones opcionales
            'sistemas' => $this->whenLoaded('sistemas'),
        ];
    }
}
