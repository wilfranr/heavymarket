<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmpresaRequest;
use App\Http\Resources\EmpresaResource;
use App\Models\Empresa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controlador API para gestión de Empresas
 */
class EmpresaController extends Controller
{
    /**
     * Listar todas las empresas
     */
    public function index(Request $request): JsonResponse
    {
        $query = Empresa::query()
            ->with(['country', 'city', 'states']);

        // Filtros
        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        if ($request->filled('country_id')) {
            $query->where('country_id', $request->input('country_id'));
        }

        if ($request->filled('city_id')) {
            $query->where('city_id', $request->input('city_id'));
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $empresas = $query->paginate($perPage);

        return response()->json([
            'data' => EmpresaResource::collection($empresas->items()),
            'meta' => [
                'current_page' => $empresas->currentPage(),
                'last_page' => $empresas->lastPage(),
                'per_page' => $empresas->perPage(),
                'total' => $empresas->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva empresa
     */
    public function store(StoreEmpresaRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            $empresa = Empresa::create($validated);

            DB::commit();

            $empresa->load(['country', 'city', 'states']);

            return response()->json([
                'data' => new EmpresaResource($empresa),
                'message' => 'Empresa creada exitosamente',
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al crear la empresa',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar una empresa específica
     */
    public function show(Empresa $empresa): JsonResponse
    {
        $empresa->load(['country', 'city', 'states']);

        return response()->json([
            'data' => new EmpresaResource($empresa),
        ]);
    }

    /**
     * Actualizar una empresa
     */
    public function update(Request $request, Empresa $empresa): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:300', 'unique:empresas,nombre,'.$empresa->id],
            'siglas' => ['nullable', 'string', 'max:10'],
            'direccion' => ['sometimes', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'celular' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:empresas,email,'.$empresa->id],
            'nit' => ['sometimes', 'string', 'max:255', 'unique:empresas,nit,'.$empresa->id],
            'representante' => ['sometimes', 'string', 'max:255'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'estado' => ['sometimes', 'boolean'],
            'flete' => ['nullable', 'numeric', 'min:0'],
            'trm' => ['nullable', 'numeric', 'min:0'],
            'logo_light' => ['nullable', 'string', 'max:255'],
            'logo_dark' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $empresa->update($validated);
            $empresa->load(['country', 'city', 'states']);

            return response()->json([
                'data' => new EmpresaResource($empresa),
                'message' => 'Empresa actualizada exitosamente',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar la empresa',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar una empresa
     */
    public function destroy(Empresa $empresa): JsonResponse
    {
        try {
            $empresa->delete();

            return response()->json([
                'message' => 'Empresa eliminada exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la empresa',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
