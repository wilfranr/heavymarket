<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReferenciaRequest;
use App\Http\Requests\UpdateReferenciaRequest;
use App\Http\Resources\ReferenciaResource;
use App\Models\Referencia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
/**
 * Controlador API para gestión de Referencias
 *
 * Maneja todas las operaciones CRUD de referencias a través del API REST.
 */
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReferenciaController extends Controller
{
    use AuthorizesRequests;

    /**
     * Buscar referencias existentes por lotes (no crea registros nuevos).
     *
     * Autorizado para quienes puedan listar referencias (Analista, Vendedor, etc.).
     */
    public function bulkSearch(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Referencia::class);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.codigo' => ['required', 'string'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
        ]);

        $items = $validated['items'];
        $codigosUnicos = [];
        foreach ($items as $item) {
            $c = strtoupper(trim($item['codigo']));
            if ($c !== '') {
                $codigosUnicos[$c] = true;
            }
        }
        $codigosUnicos = array_keys($codigosUnicos);

        $existentes = Referencia::query()
            ->whereIn('referencia', $codigosUnicos)
            ->with(['articulo', 'marca'])
            ->get()
            ->keyBy(fn ($ref) => strtoupper($ref->referencia));

        $resultados = [];
        $noEncontrados = [];

        foreach ($items as $item) {
            $codigo = strtoupper(trim($item['codigo']));
            if ($codigo === '') {
                continue;
            }
            if ($existentes->has($codigo)) {
                $referencia = $existentes->get($codigo);
                $resultados[] = [
                    'referencia_id' => $referencia->id,
                    'codigo' => $referencia->referencia,
                    'cantidad' => $item['cantidad'],
                    'referencia' => new ReferenciaResource($referencia),
                ];
            } else {
                $noEncontrados[] = $codigo;
            }
        }

        $noEncontrados = array_values(array_unique($noEncontrados));

        return response()->json([
            'data' => $resultados,
            'no_encontrados' => $noEncontrados,
            'message' => count($resultados).' referencia(s) encontrada(s)',
        ]);
    }

    /**
     * Buscar o crear referencias por lotes
     */
    public function bulkSearchOrCreate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.codigo' => ['required', 'string'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
            'es_temporal' => ['nullable', 'boolean'],
            'marca_id' => [
                'nullable',
                'integer',
                Rule::exists('listas', 'id')->whereIn('tipo', ['Marca', 'Fabricantes']),
            ],
        ]);

        $items = $validated['items'];
        $esTemporal = $validated['es_temporal'] ?? false;
        $marcaId = $validated['marca_id'] ?? null;
        $codigos = array_map('strtoupper', array_column($items, 'codigo'));

        // Buscar referencias existentes
        $existentes = Referencia::whereIn('referencia', $codigos)
            ->with(['articulo', 'marca'])
            ->get()
            ->keyBy(function ($item) {
                return strtoupper($item->referencia);
            });

        $resultados = [];

        DB::beginTransaction();
        try {
            foreach ($items as $item) {
                $codigo = strtoupper($item['codigo']);

                if ($existentes->has($codigo)) {
                    $referencia = $existentes->get($codigo);

                    // Si ya existe pero no tiene marca (o es temporal y se proporciona una marca nueva), actualizamos
                    if ($marcaId && (! $referencia->marca_id || ($referencia->es_temporal && $referencia->marca_id !== $marcaId))) {
                        $referencia->update(['marca_id' => $marcaId]);
                    }
                } else {
                    // Crear si no existe
                    $referencia = Referencia::create([
                        'referencia' => $codigo,
                        'marca_id' => $marcaId,
                        'es_temporal' => $esTemporal,
                        'comentario' => $esTemporal
                            ? 'Referencia temporal desde Landing - Requiere revisión'
                            : 'Creada desde importación masiva',
                    ]);
                    // Añadir a existentes para evitar duplicados en el mismo lote
                    $existentes->put($codigo, $referencia);
                }

                $resultados[] = [
                    'referencia_id' => $referencia->id,
                    'codigo' => $referencia->referencia,
                    'cantidad' => $item['cantidad'],
                    'referencia' => new ReferenciaResource($referencia->load(['marca', 'articulo'])),
                ];
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al procesar el lote de referencias',
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'data' => $resultados,
            'message' => count($resultados).' referencia(s) procesada(s) exitosamente',
        ]);
    }

    /**
     * Listar todas las referencias con filtros opcionales
     *
     *
     * @queryParam page int Número de página. Example: 1
     * @queryParam per_page int Elementos por página. Example: 15
     * @queryParam search string Buscar en referencia o comentario. Example: REF123
     * @queryParam marca_id int Filtrar por marca. Example: 1
     */
    public function index(Request $request): JsonResponse
    {
        $query = Referencia::query()->with(['articulo', 'marca', 'articulos']);

        // Búsqueda en referencia o comentario
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('referencia', 'like', "%{$search}%")
                    ->orWhere('comentario', 'like', "%{$search}%");
            });
        }

        // Filtro por marca
        if ($request->filled('marca_id')) {
            $query->where('marca_id', $request->input('marca_id'));
        }

        // Filtro por artículo
        if ($request->filled('articulo_id')) {
            $query->where('articulo_id', $request->input('articulo_id'));
        }

        // Filtro por referencias temporales (Landing)
        if ($request->has('es_temporal')) {
            $query->where('es_temporal', $request->boolean('es_temporal'));
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'referencia');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $referencias = $query->paginate($perPage);

        return response()->json([
            'data' => ReferenciaResource::collection($referencias),
            'meta' => [
                'current_page' => $referencias->currentPage(),
                'last_page' => $referencias->lastPage(),
                'per_page' => $referencias->perPage(),
                'total' => $referencias->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva referencia
     */
    public function store(StoreReferenciaRequest $request): JsonResponse
    {
        $this->authorize('create', \App\Models\Referencia::class);
        $referencia = Referencia::create($request->validated());

        return response()->json([
            'message' => 'Referencia creada exitosamente',
            'data' => new ReferenciaResource($referencia->load(['marca', 'articulo'])),
        ], 201);
    }

    /**
     * Mostrar una referencia específica
     */
    public function show(Referencia $referencia): JsonResponse
    {
        $referencia->load(['marca', 'articulos', 'articulo']);

        return response()->json([
            'data' => new ReferenciaResource($referencia),
        ]);
    }

    /**
     * Actualizar una referencia existente
     */
    public function update(UpdateReferenciaRequest $request, Referencia $referencia): JsonResponse
    {
        $this->authorize('update', $referencia);
        $data = $request->validated();

        // Si la referencia era temporal (de Landing), al editarla manualmente se convierte en oficial
        if ($referencia->es_temporal) {
            $data['es_temporal'] = false;
        }

        $referencia->update($data);

        return response()->json([
            'message' => 'Referencia actualizada exitosamente',
            'data' => new ReferenciaResource($referencia->fresh()->load(['marca', 'articulo'])),
        ]);
    }

    /**
     * Eliminar una referencia
     */
    public function destroy(Referencia $referencia): JsonResponse
    {
        $this->authorize('delete', $referencia);
        $referencia->delete();

        return response()->json([
            'message' => 'Referencia eliminada exitosamente',
        ]);
    }
}
