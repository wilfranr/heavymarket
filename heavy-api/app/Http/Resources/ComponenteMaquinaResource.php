<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ComponenteMaquinaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'maquina_id' => $this->maquina_id,
            'sistema_id' => $this->sistema_id,
            'marca_id' => $this->marca_id,
            'modelo' => $this->modelo,
            'serie' => $this->serie,
            'comentario' => $this->comentario,
            'foto_placa' => $this->foto_placa ? Storage::disk('public')->url($this->foto_placa) : null,
            'sistema' => new SistemaResource($this->whenLoaded('sistema')),
            'marca' => new ListaResource($this->whenLoaded('marca')),
        ];
    }
}
