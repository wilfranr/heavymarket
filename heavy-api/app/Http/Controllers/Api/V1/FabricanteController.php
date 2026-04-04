<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\FabricanteResource;
use App\Models\Fabricante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Catálogo interno de fabricantes (solo lectura vía API).
 *
 * El recurso REST completo fue retirado (issue #75); este listado paginado
 * permanece para selects en pedidos, máquinas, listas, terceros, etc.
 */
class FabricanteController extends Controller
{
    /**
     * Listado paginado para uso en la aplicación (dropdowns, filtros).
     *
     * @queryParam page int Número de página. Example: 1
     * @queryParam per_page int Elementos por página. Example: 15
     * @queryParam search string Buscar en nombre o descripción. Example: Caterpillar
     */
    public function catalogoIndex(Request $request): JsonResponse
    {
        $query = Fabricante::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('descripcion', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->input('sort_by', 'nombre');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = (int) $request->input('per_page', 15);
        $fabricantes = $query->paginate($perPage);

        return response()->json([
            'data' => FabricanteResource::collection($fabricantes),
            'meta' => [
                'current_page' => $fabricantes->currentPage(),
                'last_page' => $fabricantes->lastPage(),
                'per_page' => $fabricantes->perPage(),
                'total' => $fabricantes->total(),
            ],
        ]);
    }
}
