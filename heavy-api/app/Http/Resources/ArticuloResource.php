<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            'es_pieza_estandar' => (bool) $this->es_pieza_estandar,
            'peso' => $this->peso,
            'comentarios' => $this->comentarios,
            'fotoDescriptiva' => $this->fotoDescriptiva && ! filter_var($this->fotoDescriptiva, FILTER_VALIDATE_URL) ? Storage::disk('public')->url($this->fotoDescriptiva) : $this->fotoDescriptiva,
            'foto_medida' => $this->foto_medida && ! filter_var($this->foto_medida, FILTER_VALIDATE_URL) ? Storage::disk('public')->url($this->foto_medida) : $this->foto_medida,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'referencias' => $this->when(
                $this->relationLoaded('referencias') || $this->relationLoaded('referenciasDirectas'),
                function () {
                    $pivot = $this->relationLoaded('referencias') ? $this->referencias : collect();
                    $directas = $this->relationLoaded('referenciasDirectas') ? $this->referenciasDirectas : collect();
                    return ReferenciaResource::collection($pivot->merge($directas)->unique('id'));
                }
            ),
            'medidas' => $this->whenLoaded('medidas'),
            'articuloJuegos' => $this->whenLoaded('articuloJuegos'),
        ];
    }
}
