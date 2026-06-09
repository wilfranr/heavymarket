<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\TRM;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource para el modelo TRM
 *
 * Transforma los datos de TRM en una respuesta JSON estructurada.
 *
 * @property TRM $resource
 */
class TRMResource extends JsonResource
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
            'trm' => $this->trm,
            'fecha' => $this->fecha?->format('Y-m-d'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
