<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactoRequest;
use App\Http\Resources\ContactoResource;
use App\Models\Contacto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controlador API para gestión de Contactos
 */
class ContactoController extends Controller
{
    /**
     * Listar todos los contactos
     */
    public function index(Request $request): JsonResponse
    {
        $query = Contacto::query()
            ->with(['tercero', 'country']);

        // Filtro por tercero
        if ($request->filled('tercero_id')) {
            $query->where('tercero_id', $request->input('tercero_id'));
        }

        // Búsqueda
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'nombre');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $contactos = $query->paginate($perPage);

        return response()->json([
            'data' => ContactoResource::collection($contactos->items()),
            'meta' => [
                'current_page' => $contactos->currentPage(),
                'last_page' => $contactos->lastPage(),
                'per_page' => $contactos->perPage(),
                'total' => $contactos->total(),
            ],
        ]);
    }

    /**
     * Crear un nuevo contacto
     */
    public function store(StoreContactoRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            $contacto = Contacto::create($validated);

            DB::commit();

            $contacto->load(['tercero', 'country']);

            return response()->json([
                'data' => new ContactoResource($contacto),
                'message' => 'Contacto creado exitosamente',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al crear el contacto',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar un contacto específico
     */
    public function show(Contacto $contacto): JsonResponse
    {
        $contacto->load(['tercero', 'country']);

        return response()->json([
            'data' => new ContactoResource($contacto),
        ]);
    }

    /**
     * Actualizar un contacto
     */
    public function update(Request $request, Contacto $contacto): JsonResponse
    {
        $validated = $request->validate([
            'tercero_id' => ['sometimes', 'integer', 'exists:terceros,id'],
            'nombre' => ['sometimes', 'string', 'max:255'],
            'cargo' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'indicativo' => ['nullable', 'string', 'max:10'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'email' => ['nullable', 'email', 'max:255'],
            'principal' => ['nullable', 'boolean'],
        ]);

        try {
            DB::beginTransaction();

            $contacto->update($validated);

            DB::commit();

            $contacto->load(['tercero', 'country']);

            return response()->json([
                'data' => new ContactoResource($contacto),
                'message' => 'Contacto actualizado exitosamente',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al actualizar el contacto',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar un contacto
     */
    public function destroy(Contacto $contacto): JsonResponse
    {
        try {
            $contacto->delete();

            return response()->json([
                'message' => 'Contacto eliminado exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar el contacto',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
