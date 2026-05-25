<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateCountryRequest;
use App\Http\Resources\CountryResource;
use App\Models\Country;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controlador API para gestión de Países (CRUD)
 *
 * Maneja operaciones de lectura y actualización de países,
 * incluyendo la configuración de tarifas de flete.
 */
class CountryController extends Controller
{
    /**
     * Listar todos los países con filtros opcionales
     *
     * @queryParam page int Número de página. Example: 1
     * @queryParam per_page int Elementos por página. Example: 15
     * @queryParam search string Buscar por nombre. Example: Colombia
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasAnyRole(['super_admin', 'Administrador'])) {
            abort(403, 'No autorizado');
        }

        $query = Country::query();

        // Búsqueda por nombre
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'updated_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 50);
        $page = (int) $request->input('page', 1);
        $countries = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => CountryResource::collection($countries->items()),
            'meta' => [
                'current_page' => $countries->currentPage(),
                'last_page' => $countries->lastPage(),
                'per_page' => $countries->perPage(),
                'total' => $countries->total(),
            ],
        ]);
    }

    /**
     * Mostrar un país específico
     */
    public function show(Request $request, Country $country): JsonResponse
    {
        if (!$request->user()->hasAnyRole(['super_admin', 'Administrador'])) {
            abort(403, 'No autorizado');
        }

        return response()->json([
            'data' => new CountryResource($country),
        ]);
    }

    /**
     * Actualizar un país existente
     */
    public function update(UpdateCountryRequest $request, Country $country): JsonResponse
    {
        $data = $request->validated();
        $country->update($data);

        return response()->json([
            'message' => 'País actualizado exitosamente',
            'data' => new CountryResource($country->fresh()),
        ]);
    }
}
