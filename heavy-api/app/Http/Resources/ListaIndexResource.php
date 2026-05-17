<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Lista;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Resource liviano para el listado paginado de listas (sin relaciones ni I/O en disco).
 *
 * @property Lista $resource
 */
class ListaIndexResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $attributes = $this->resource->getAttributes();

        return [
            'id' => $this->id,
            'tipo' => $this->tipo,
            'nombre' => $this->nombre,
            'definicion' => $this->definicion,
            'foto' => $this->publicUrl($attributes['foto'] ?? null),
            'fotoMedida' => $this->publicUrl($attributes['fotoMedida'] ?? null),
            'sistema_id' => $this->sistema_id,
            'parent_id' => $this->parent_id,
            'fabricante_id' => $this->fabricante_id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    private function publicUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (str_starts_with($path, 'http') || filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        // Legacy: solo nombre de archivo (p. ej. AC_Abrazadera.png) sin ruta en disco bajo public/storage.
        // En listado no resolvemos I/O ni URLs rotas; el detalle sigue usando ListaResource + accessor.
        if (! str_contains($path, '/')) {
            return null;
        }

        if (app()->environment('local', 'testing')) {
            return '/storage/'.ltrim($path, '/');
        }

        return Storage::disk('public')->url($path);
    }
}
