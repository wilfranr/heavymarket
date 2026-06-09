<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Articulo;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * API Resource para el modelo Artículo
 *
 * Transforma los datos de artículos en una respuesta JSON estructurada.
 *
 * @property Articulo $resource
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
            'foto_medida' => $this->foto_medida
                ? (! filter_var($this->foto_medida, FILTER_VALIDATE_URL) ? Storage::disk('public')->url($this->foto_medida) : $this->foto_medida)
                : ($this->relationLoaded('piezaEstandar') && $this->piezaEstandar && $this->piezaEstandar->fotoMedida
                    ? (! filter_var($this->piezaEstandar->fotoMedida, FILTER_VALIDATE_URL) ? Storage::disk('public')->url($this->piezaEstandar->fotoMedida) : $this->piezaEstandar->fotoMedida)
                    : null),
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
            'componentes_juego' => $this->when(
                $this->relationLoaded('articuloJuegos'),
                fn () => $this->articuloJuegos->map(fn ($aj) => [
                    'cantidad' => $aj->pivot?->cantidad ?? $aj->cantidad,
                    'referencia' => $aj->referencia?->referencia,
                    'descripcion' => $aj->referencia?->articulo?->definicion ?? $aj->referencia?->comentario,
                    'comentario' => $aj->comentario,
                ])
            ),
        ];
    }
}
