<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecepcionCompraImagenResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'recepcion_compra_id' => $this->recepcion_compra_id,
            'ruta' => $this->ruta,
            'url' => $this->ruta ? asset('storage/'.ltrim((string) $this->ruta, '/')) : null,
            'nombre_original' => $this->nombre_original,
            'mime' => $this->mime,
            'size' => $this->size,
            'tipo' => $this->tipo,
            'creado_por' => $this->creado_por,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
