<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMaquinaRequest;
use App\Http\Requests\UpdateMaquinaRequest;
use App\Http\Resources\MaquinaResource;
use App\Models\Maquina;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
/**
 * Controlador API para gestión de Máquinas
 *
 * Maneja todas las operaciones CRUD de máquinas a través del API REST.
 */
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MaquinaController extends Controller
{
    use AuthorizesRequests;

    /**
     * Listar todas las máquinas con filtros opcionales
     *
     * @queryParam page int Número de página. Example: 1
     * @queryParam per_page int Elementos por página. Example: 15
     * @queryParam search string Buscar en modelo, serie o arreglo. Example: CAT
     * @queryParam fabricante_id int Filtrar por fabricante. Example: 1
     * @queryParam tipo int Filtrar por tipo de máquina. Example: 1
     * @queryParam tercero_id int Filtrar por tercero asociado (relación muchos a muchos). Example: 5
     */
    public function index(Request $request): JsonResponse
    {
        $query = Maquina::query()->with(['fabricante', 'listas', 'terceros']);

        // Búsqueda en modelo, serie o arreglo
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('modelo', 'like', "%{$search}%")
                    ->orWhere('serie', 'like', "%{$search}%")
                    ->orWhere('arreglo', 'like', "%{$search}%");
            });
        }

        // Filtro por fabricante
        if ($request->filled('fabricante_id')) {
            $query->where('fabricante_id', $request->input('fabricante_id'));
        }

        // Filtro por tipo
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }

        // Filtro por tercero asociado (pivot tercero_maquina)
        if ($request->filled('tercero_id')) {
            $terceroId = (int) $request->input('tercero_id');
            $query->whereHas('terceros', function ($q) use ($terceroId) {
                $q->where('tercero_id', $terceroId);
            });
        }

        // Filtro por disponibilidad
        if ($request->boolean('disponibles')) {
            $exceptTerceroId = $request->filled('except_tercero_id')
                ? (int) $request->input('except_tercero_id')
                : null;
            $query->available($exceptTerceroId);
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'modelo');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $maquinas = $query->paginate($perPage);

        return response()->json([
            'data' => MaquinaResource::collection($maquinas),
            'meta' => [
                'current_page' => $maquinas->currentPage(),
                'last_page' => $maquinas->lastPage(),
                'per_page' => $maquinas->perPage(),
                'total' => $maquinas->total(),
            ],
        ]);
    }

    /**
     * Crear una nueva máquina
     */
    public function store(StoreMaquinaRequest $request): JsonResponse
    {
        $this->authorize('create', Maquina::class);
        $data = $request->validated();

        if ($request->hasFile('foto')) {
            $data['foto'] = $request->file('foto')->store('maquinas', 'public');
        }

        if ($request->hasFile('fotoId')) {
            $data['fotoId'] = $request->file('fotoId')->store('maquinas/ids', 'public');
        }

        // Creada por asesor en la app: datos validados en origen
        $data['estado_revision'] = 'revisado';

        $maquina = Maquina::create($data);

        // Si se enviaron componentes, guardarlos
        if ($request->filled('componentes')) {
            $this->saveComponentes($maquina, $request->input('componentes'));
        }

        // Si se envió un tercero_id, asociar la máquina
        if ($request->filled('tercero_id')) {
            $maquina->terceros()->attach($request->input('tercero_id'));
        }

        return response()->json([
            'message' => 'Máquina creada exitosamente',
            'data' => new MaquinaResource($maquina->load(['fabricante', 'listas', 'componentes'])),
        ], 201);
    }

    /**
     * Mostrar una máquina específica
     */
    public function show(Maquina $maquina): JsonResponse
    {
        $maquina->load(['fabricante', 'listas', 'componentes.sistema', 'componentes.marca', 'terceros']);

        return response()->json([
            'data' => new MaquinaResource($maquina),
        ]);
    }

    /**
     * Actualizar una máquina existente
     */
    public function update(UpdateMaquinaRequest $request, Maquina $maquina): JsonResponse
    {
        $this->authorize('update', $maquina);
        $data = $request->validated();

        if ($request->hasFile('foto')) {
            // Eliminar foto anterior si existe
            if ($maquina->foto) {
                Storage::disk('public')->delete($maquina->foto);
            }
            $data['foto'] = $request->file('foto')->store('maquinas', 'public');
        }

        if ($request->hasFile('fotoId')) {
            if ($maquina->fotoId) {
                Storage::disk('public')->delete($maquina->fotoId);
            }
            $data['fotoId'] = $request->file('fotoId')->store('maquinas/ids', 'public');
        }

        unset($data['estado_revision']);

        if ($maquina->estado_revision === 'por_revisar') {
            $data['estado_revision'] = 'revisado';
        }

        $maquina->update($data);

        // Actualizar componentes si se enviaron
        if ($request->has('componentes')) {
            $this->saveComponentes($maquina, $request->input('componentes') ?? []);
        }

        return response()->json([
            'message' => 'Máquina actualizada exitosamente',
            'data' => new MaquinaResource($maquina->fresh()->load(['fabricante', 'listas', 'componentes.sistema', 'componentes.marca'])),
        ]);
    }

    /**
     * Eliminar una máquina
     */
    public function destroy(Maquina $maquina): JsonResponse
    {
        $this->authorize('delete', $maquina);
        if ($maquina->foto) {
            Storage::disk('public')->delete($maquina->foto);
        }
        if ($maquina->fotoId) {
            Storage::disk('public')->delete($maquina->fotoId);
        }

        $maquina->delete();

        return response()->json([
            'message' => 'Máquina eliminada exitosamente',
        ]);
    }

    /**
     * Guarda o actualiza los componentes de una máquina
     */
    private function saveComponentes(Maquina $maquina, array $componentesData): void
    {
        $idsToKeep = [];

        foreach ($componentesData as $index => $data) {
            // Limpiar datos nulos o vacíos para evitar errores de BD si se envían strings vacíos en campos opcionales
            $cleanData = array_filter($data, function ($value) {
                return $value !== null && $value !== '' && ! ($value instanceof UploadedFile);
            });

            if (isset($data['id']) && ! empty($data['id'])) {
                $componente = $maquina->componentes()->find($data['id']);
                if ($componente) {
                    $componente->update($cleanData);
                    $idsToKeep[] = $componente->id;
                }
            } else {
                $componente = $maquina->componentes()->create($cleanData);
                $idsToKeep[] = $componente->id;
            }

            // Manejar carga de imagen para cada componente
            $fileKey = "componentes.{$index}.foto_placa";
            if (request()->hasFile($fileKey)) {
                if ($componente->foto_placa) {
                    Storage::disk('public')->delete($componente->foto_placa);
                }
                $path = request()->file($fileKey)->store('maquinas/componentes', 'public');
                $componente->update(['foto_placa' => $path]);
            }
        }

        // Eliminar componentes que no están en la lista (sincronización)
        $maquina->componentes()->whereNotIn('id', $idsToKeep)->delete();
    }
}
