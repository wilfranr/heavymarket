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
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tipo_documento' => $this->tipo_documento,
            'numero_documento' => $this->numero_documento,
            'nombre' => $this->nombre,
            'tipo' => $this->tipo,
            'email' => $this->email,
            'telefono' => $this->telefono,
            'direccion' => $this->direccion,
            'forma_pago' => $this->forma_pago,
            // Muchos-a-muchos vía pivot tercero_categoria_comercial (ya no hay columna en terceros)
            'categoria_comercial_id' => $this->when(
                $this->relationLoaded('categoriasComerciales'),
                fn () => $this->categoriasComerciales->first()?->id,
                null
            ),
            'categoria_comercial_ids' => $this->when(
                $this->relationLoaded('categoriasComerciales'),
                fn () => $this->categoriasComerciales->pluck('id')->values()->all(),
                null
            ),
            'fabricante_ids' => $this->when(
                $this->relationLoaded('fabricantes'),
                fn () => $this->fabricantes->pluck('id')->values()->all(),
                null
            ),
            'email_factura_electronica' => $this->email_factura_electronica,
            'sitio_web' => $this->sitio_web,
            'dv' => $this->dv,
            'estado' => $this->estado,
            'landing_access' => (bool) $this->landing_access,

            // Files mapping if needed, or return full urls
            'rut' => $this->rut ? \Storage::url($this->rut) : null,
            'certificacion_bancaria' => $this->certificacion_bancaria ? \Storage::url($this->certificacion_bancaria) : null,
            'camara_comercio' => $this->camara_comercio ? \Storage::url($this->camara_comercio) : null,
            'cedula_representante_legal' => $this->cedula_representante_legal ? \Storage::url($this->cedula_representante_legal) : null,

            // Location
            'country_id' => $this->country_id,
            'state_id' => $this->state_id,
            'city_id' => $this->city_id,
            'country' => $this->whenLoaded('country'),
            'state' => $this->whenLoaded('state'),
            'city' => $this->whenLoaded('city'),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relaciones opcionales
            'contactos' => ContactoResource::collection($this->whenLoaded('contactos')),
            'direcciones' => $this->whenLoaded('direcciones'),
            'fabricantes' => $this->whenLoaded('fabricantes'),
            'sistemas' => $this->whenLoaded('sistemas'),
            'categorias_comerciales' => $this->whenLoaded('categoriasComerciales'),
            'maquinas' => $this->whenLoaded('maquinas'),
        ];
    }
}
