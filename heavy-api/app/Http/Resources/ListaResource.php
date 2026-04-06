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
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tipo' => $this->tipo,
            'nombre' => $this->nombre,
            'definicion' => $this->definicion,
            'foto' => $this->when(
                $this->foto,
                fn () => str_starts_with($this->foto, 'http') 
                    ? $this->foto 
                    : Storage::disk('public')->url($this->foto)
            ),
            'logo' => $this->foto, // Alias para compatibilidad con landing
            'fotoMedida' => $this->fotoMedida && ! filter_var($this->fotoMedida, FILTER_VALIDATE_URL) ? Storage::disk('public')->url($this->fotoMedida) : $this->fotoMedida,
            'sistema_id' => $this->sistema_id,
            'parent_id' => $this->parent_id,
            'fabricante_id' => $this->fabricante_id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),

            // Relaciones opcionales
            'sistemas' => $this->whenLoaded('sistemas'),
            'fabricante' => $this->whenLoaded(
                'fabricante',
                fn () => (new FabricanteResource($this->fabricante))->resolve($request)
            ),
        ];
    }
}
