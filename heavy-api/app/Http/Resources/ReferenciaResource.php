<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Referencia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Referencia
 *
 * Transforma los datos de referencias en una respuesta JSON estructurada.
 *
 * @property Referencia $resource
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
            'articulo_id' => $this->articulo_id,
            'es_temporal' => $this->es_temporal,
            'comentario' => $this->comentario,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'articulo' => new ArticuloResource($this->whenLoaded('articulo')),
            'marca' => $this->whenLoaded('marca'),
            'articulos' => $this->whenLoaded('articulos'),
            'categoriaComercial' => $this->whenLoaded('categoriaComercial'),
            'lista_id' => $this->lista_id,

            // Cuando `articulo` está cargado (análisis / listados #69)
            'articulo_es_pieza_estandar' => $this->when(
                $this->relationLoaded('articulo') && $this->articulo,
                fn () => (bool) $this->articulo->es_pieza_estandar
            ),
            'articulo_definicion' => $this->when(
                $this->relationLoaded('articulo') && $this->articulo,
                fn () => $this->articulo->definicion
            ),
            'articulo_descripcion_especifica' => $this->when(
                $this->relationLoaded('articulo') && $this->articulo,
                fn () => $this->articulo->descripcionEspecifica
            ),
        ];
    }
}
