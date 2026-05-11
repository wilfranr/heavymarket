<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Pedido
 *
 * Transforma los datos del modelo Pedido en una respuesta JSON
 * estructurada para el API REST.
 *
 * @property Pedido $resource
 */
class PedidoResource extends JsonResource
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
                    'tipo' => $this->maquina->listas?->nombre ?? 'N/A',
                    'nombre' => $this->maquina->nombre,
                    'modelo' => $this->maquina->modelo,
                    'serie' => $this->maquina->serie,
                    'marca' => $this->maquina->fabricante?->nombre ?? 'N/A',
                    'estado_revision' => $this->maquina->estado_revision,
                    'id_interno' => $this->maquina->id_interno ?? '----',
                    'arreglo' => $this->maquina->arreglo,
                    'imagen_url' => $this->maquina->imagen_url,
                    'imagen_placa_url' => $this->maquina->imagen_placa_url,
                    'marca_motor' => $this->maquina->marca_motor,
                    'modelo_motor' => $this->maquina->modelo_motor,
                    'serie_motor' => $this->maquina->serie_motor,
                    'comentario_motor' => $this->maquina->comentario_motor,
                    'imagen_motor_url' => $this->maquina->imagen_motor_url,
                    'marca_transmision' => $this->maquina->marca_transmision,
                    'modelo_transmision' => $this->maquina->modelo_transmision,
                    'serie_transmision' => $this->maquina->serie_transmision,
                    'comentario_transmision' => $this->maquina->comentario_transmision,
                    'imagen_transmision_url' => $this->maquina->imagen_transmision_url,
                    'componentes' => $this->maquina->relationLoaded('componentes')
                        ? ComponenteMaquinaResource::collection($this->maquina->componentes)
                        : [],
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
                return PedidoReferenciaResource::collection($this->referencias);
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
