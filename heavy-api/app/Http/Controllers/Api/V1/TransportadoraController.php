<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransportadoraRequest;
use App\Http\Resources\TransportadoraResource;
use App\Models\Transportadora;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controlador API para gestión de Transportadoras
 */
class TransportadoraController extends Controller
{
    /**
     * Listar todas las transportadoras
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transportadora::query()
            ->with(['country', 'city', 'state']);

        // Búsqueda
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('nit', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('contacto', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'nombre');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $transportadoras = $query->paginate($perPage);

        return response()->json([
            'data' => TransportadoraResource::collection($transportadoras->items()),
            'meta' => [
                'current_page' => $transportadoras->currentPage(),
                'last_page' => $transportadoras->lastPage(),
                'per_page' => $transportadoras->perPage(),
                'total' => $transportadoras->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva transportadora
     */
    public function store(StoreTransportadoraRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            $transportadora = Transportadora::create($validated);

            DB::commit();

            $transportadora->load(['country', 'city', 'state']);

            return response()->json([
                'data' => new TransportadoraResource($transportadora),
                'message' => 'Transportadora creada exitosamente',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al crear la transportadora',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar una transportadora específica
     */
    public function show(Transportadora $transportadora): JsonResponse
    {
        $transportadora->load(['country', 'city', 'state']);

        return response()->json([
            'data' => new TransportadoraResource($transportadora),
        ]);
    }

    /**
     * Actualizar una transportadora
     */
    public function update(Request $request, Transportadora $transportadora): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:255'],
            'nit' => ['nullable', 'string', 'max:50', 'unique:transportadoras,nit,'.$transportadora->id],
            'telefono' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string', 'max:500'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'email' => ['nullable', 'email', 'max:255'],
            'contacto' => ['nullable', 'string', 'max:255'],
            'celular' => ['nullable', 'string', 'max:50'],
            'observaciones' => ['nullable', 'string'],
            'logo' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            DB::beginTransaction();

            $transportadora->update($validated);

            DB::commit();

            $transportadora->load(['country', 'city', 'state']);

            return response()->json([
                'data' => new TransportadoraResource($transportadora),
                'message' => 'Transportadora actualizada exitosamente',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al actualizar la transportadora',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una transportadora
     */
    public function destroy(Transportadora $transportadora): JsonResponse
    {
        try {
            $transportadora->delete();

            return response()->json([
                'message' => 'Transportadora eliminada exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la transportadora',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
