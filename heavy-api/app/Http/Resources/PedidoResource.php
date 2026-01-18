<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Pedido
 * 
 * Transforma los datos del modelo Pedido en una respuesta JSON
 * estructurada para el API REST.
 * 
 * @property \App\Models\Pedido $resource
 */
class PedidoResource extends JsonResource
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
            'user_id' => $this->user_id,
            'tercero_id' => $this->tercero_id,
            'direccion' => $this->direccion,
            'comentario' => $this->comentario,
            'contacto_id' => $this->contacto_id,
            'estado' => $this->estado,
            'maquina_id' => $this->maquina_id,
            'fabricante_id' => $this->fabricante_id,
            'motivo_rechazo' => $this->motivo_rechazo,
            'comentarios_rechazo' => $this->comentarios_rechazo,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relaciones (solo si están cargadas)
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ];
            }),
            
            'tercero' => $this->whenLoaded('tercero', function () {
                return new TerceroResource($this->tercero);
            }),
            
            'maquina' => $this->whenLoaded('maquina', function () {
                return [
                    'id' => $this->maquina->id,
                    'nombre' => $this->maquina->nombre,
                ];
            }),
            
            'fabricante' => $this->whenLoaded('fabricante', function () {
                return [
                    'id' => $this->fabricante->id,
                    'nombre' => $this->fabricante->nombre,
                ];
            }),
            
            'contacto' => $this->whenLoaded('contacto', function () {
                return [
                    'id' => $this->contacto->id,
                    'nombre' => $this->contacto->nombre,
                    'telefono' => $this->contacto->telefono,
                    'email' => $this->contacto->email,
                ];
            }),
            
            'referencias' => $this->whenLoaded('referencias', function () {
                return ReferenciaResource::collection($this->referencias);
            }),
            
            'articulos' => $this->whenLoaded('articulos', function () {
                return ArticuloResource::collection($this->articulos);
            }),
            
            // Contadores útiles
            'total_referencias' => $this->whenCounted('referencias'),
            'total_articulos' => $this->whenCounted('articulos'),
        ];
    }
}
