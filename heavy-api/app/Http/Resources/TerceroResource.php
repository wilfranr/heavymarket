<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo Tercero
 * 
 * Transforma los datos de terceros (clientes/proveedores)
 * en una respuesta JSON estructurada.
 * 
 * @property \App\Models\Tercero $resource
 */
class TerceroResource extends JsonResource
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
            'tipo_documento' => $this->tipo_documento,
            'documento' => $this->documento,
            'razon_social' => $this->razon_social,
            'nombre_comercial' => $this->nombre_comercial,
            'tipo_tercero' => $this->tipo_tercero,
            'email' => $this->email,
            'telefono' => $this->telefono,
            'celular' => $this->celular,
            'direccion' => $this->direccion,
            'ciudad' => $this->ciudad,
            'pais' => $this->pais,
            'es_cliente' => (bool) $this->es_cliente,
            'es_proveedor' => (bool) $this->es_proveedor,
            'estado' => $this->estado,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relaciones opcionales
            'contactos' => $this->whenLoaded('contactos'),
            'direcciones' => $this->whenLoaded('direcciones'),
            'fabricantes' => $this->whenLoaded('fabricantes'),
            'sistemas' => $this->whenLoaded('sistemas'),
        ];
    }
}
