<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreArticuloRequest;
use App\Http\Requests\UpdateArticuloRequest;
use App\Http\Resources\ArticuloResource;
use App\Models\Articulo;
use App\Models\Lista;
use App\Models\Medida;
use App\Models\Referencia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
/**
 * Controlador API para gestión de Artículos
 *
 * Maneja todas las operaciones CRUD de artículos a través del API REST.
 */
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ArticuloController extends Controller
{
    use AuthorizesRequests;

    /**
     * Listar todos los artículos con filtros opcionales
     *
     *
     * @queryParam page int Número de página. Example: 1
     * @queryParam per_page int Elementos por página. Example: 15
     * @queryParam search string Buscar en definición o descripción específica. Example: Pistón
     */
    public function index(Request $request): JsonResponse
    {
        $query = Articulo::query()->with(['referencias.marca', 'referenciasDirectas.marca']);

        // Búsqueda en definición o descripción específica
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('definicion', 'like', "%{$search}%")
                    ->orWhere('descripcionEspecifica', 'like', "%{$search}%");
            });
        }

        // Filtro exacto por definición
        if ($request->filled('definicion')) {
            $query->where('definicion', $request->input('definicion'));
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'descripcionEspecifica');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = (int) $request->input('per_page', 15);
        $articulos = $query->paginate($perPage);

        return response()->json([
            'data' => ArticuloResource::collection($articulos),
            'meta' => [
                'current_page' => $articulos->currentPage(),
                'last_page' => $articulos->lastPage(),
                'per_page' => $articulos->perPage(),
                'total' => $articulos->total(),
            ],
        ]);
    }

    /**
     * Crear un nuevo artículo
     */
    public function store(StoreArticuloRequest $request): JsonResponse
    {
        $this->authorize('create', Articulo::class);
        $data = $request->validated();

        // Manejar carga de archivos
        if ($request->hasFile('fotoDescriptiva')) {
            $data['fotoDescriptiva'] = $request->file('fotoDescriptiva')->store('articulos/fotos', 'public');
        }

        if ($request->hasFile('foto_medida')) {
            $data['foto_medida'] = $request->file('foto_medida')->store('articulos/planos', 'public');
        }

        // Heredar foto de medida desde Piezas Estándar si no se proporciona una nueva
        if (! isset($data['foto_medida']) && isset($data['definicion'])) {
            $lista = Lista::where('tipo', 'Piezas Estandar')
                ->where('nombre', $data['definicion'])
                ->first();

            if ($lista && $lista->fotoMedida) {
                $data['foto_medida'] = $lista->fotoMedida;
            }
        }

        $articulo = Articulo::create($data);

        if ($request->has('referencias_ids')) {
            $referenciasIds = $request->input('referencias_ids');

            // Garantizar que estas referencias pertenezcan únicamente a este artículo
            Referencia::whereIn('id', $referenciasIds)->update(['articulo_id' => $articulo->id]);

            // Limpiar relaciones pivote que tengan estas referencias con otros artículos
            \DB::table('articulos_referencias')
                ->whereIn('referencia_id', $referenciasIds)
                ->where('articulo_id', '!=', $articulo->id)
                ->delete();

            $articulo->referencias()->sync($referenciasIds);
        }

        if ($request->has('medidas')) {
            $medidas = json_decode($request->input('medidas'), true);
            if (is_array($medidas)) {
                foreach ($medidas as $medidaData) {
                    $articulo->medidas()->create($medidaData);
                }
            }
        }

        if ($request->has('juegos')) {
            $juegos = json_decode($request->input('juegos'), true);
            if (is_array($juegos)) {
                foreach ($juegos as $juegoData) {
                    $articulo->articuloJuegos()->create([
                        'referencia_id' => $juegoData['referencia_id'],
                        'cantidad' => $juegoData['cantidad'],
                        'comentario' => $juegoData['comentario'] ?? null,
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Artículo creado exitosamente',
            'data' => new ArticuloResource($articulo->load(['referencias.marca', 'referenciasDirectas.marca', 'articuloJuegos.referencia.marca'])),
        ], 201);
    }

    /**
     * Mostrar un artículo específico
     */
    public function show(Articulo $articulo): JsonResponse
    {
        $articulo->load(['referencias.marca', 'referenciasDirectas.marca', 'articuloJuegos.referencia.marca', 'medidas']);

        return response()->json([
            'data' => new ArticuloResource($articulo),
        ]);
    }

    /**
     * Actualizar un artículo existente
     */
    public function update(UpdateArticuloRequest $request, Articulo $articulo): JsonResponse
    {
        $this->authorize('update', $articulo);
        $data = $request->validated();

        // Manejar carga de archivos
        if ($request->hasFile('fotoDescriptiva')) {
            // Eliminar anterior si existe y pertenece a articulos (no heredada)
            if ($articulo->fotoDescriptiva && str_starts_with($articulo->fotoDescriptiva, 'articulos/')) {
                Storage::disk('public')->delete($articulo->fotoDescriptiva);
            }
            $data['fotoDescriptiva'] = $request->file('fotoDescriptiva')->store('articulos/fotos', 'public');
        }

        if ($request->hasFile('foto_medida')) {
            // Eliminar anterior si existe y pertenece a articulos (no heredada)
            if ($articulo->foto_medida && str_starts_with($articulo->foto_medida, 'articulos/')) {
                Storage::disk('public')->delete($articulo->foto_medida);
            }
            $data['foto_medida'] = $request->file('foto_medida')->store('articulos/planos', 'public');
        }

        // Heredar foto de medida desde Piezas Estándar si cambió la definición y no se subió una foto nueva
        if (! $request->hasFile('foto_medida') && isset($data['definicion']) && $articulo->definicion !== $data['definicion']) {
            $lista = Lista::where('tipo', 'Piezas Estandar')
                ->where('nombre', $data['definicion'])
                ->first();

            if ($lista && $lista->fotoMedida) {
                // Eliminar anterior si existe y pertenece a articulos (no heredada)
                if ($articulo->foto_medida && str_starts_with($articulo->foto_medida, 'articulos/')) {
                    Storage::disk('public')->delete($articulo->foto_medida);
                }
                $data['foto_medida'] = $lista->fotoMedida;
            }
        }

        $articulo->update($data);

        if ($request->has('referencias_ids')) {
            $referenciasIds = $request->input('referencias_ids');

            // Obtener las referencias que estaban asociadas a este artículo antes del update
            $oldReferenciasIds = $articulo->referencias()->pluck('referencias.id')->toArray();

            // Referencias a desasociar
            $desasociarIds = array_diff($oldReferenciasIds, $referenciasIds);
            if (! empty($desasociarIds)) {
                Referencia::whereIn('id', $desasociarIds)
                    ->where('articulo_id', $articulo->id)
                    ->update(['articulo_id' => null]);
            }

            // Referencias a asociar
            if (! empty($referenciasIds)) {
                Referencia::whereIn('id', $referenciasIds)->update(['articulo_id' => $articulo->id]);

                // Limpiar pivot de asociaciones antiguas de estas referencias con otros artículos
                \DB::table('articulos_referencias')
                    ->whereIn('referencia_id', $referenciasIds)
                    ->where('articulo_id', '!=', $articulo->id)
                    ->delete();
            }

            $articulo->referencias()->sync($referenciasIds);
        }

        if ($request->has('juegos')) {
            $juegos = json_decode($request->input('juegos'), true);
            if (is_array($juegos)) {
                // Sincronizar borrando anteriores y creando nuevos
                $articulo->articuloJuegos()->delete();
                foreach ($juegos as $juegoData) {
                    $articulo->articuloJuegos()->create([
                        'referencia_id' => $juegoData['referencia_id'],
                        'cantidad' => $juegoData['cantidad'],
                        'comentario' => $juegoData['comentario'] ?? null,
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Artículo actualizado exitosamente',
            'data' => new ArticuloResource($articulo->fresh()->load(['referencias.marca', 'referenciasDirectas.marca', 'articuloJuegos.referencia.marca'])),
        ]);
    }

    /**
     * Eliminar un artículo
     */
    public function destroy(Articulo $articulo): JsonResponse
    {
        $this->authorize('delete', $articulo);
        $articulo->delete();

        return response()->json([
            'message' => 'Artículo eliminado exitosamente',
        ]);
    }

    /**
     * Asociar una referencia cruzada
     */
    public function addReferencia(Request $request, Articulo $articulo): JsonResponse
    {
        $request->validate([
            'referencia_id' => 'required|exists:referencias,id',
        ]);

        $referenciaId = (int) $request->input('referencia_id');

        // Garantizar que la referencia pertenezca únicamente a este artículo
        Referencia::where('id', $referenciaId)->update(['articulo_id' => $articulo->id]);

        // Limpiar relaciones pivote que tenga esta referencia con otros artículos
        \DB::table('articulos_referencias')
            ->where('referencia_id', $referenciaId)
            ->where('articulo_id', '!=', $articulo->id)
            ->delete();

        $articulo->referencias()->syncWithoutDetaching([$referenciaId]);

        return response()->json([
            'message' => 'Referencia asociada exitosamente',
            'data' => $articulo->fresh()->load(['referencias.marca', 'referenciasDirectas.marca', 'articuloJuegos.referencia.marca']),
        ]);
    }

    /**
     * Desasociar una referencia cruzada
     */
    public function removeReferencia(Articulo $articulo, Referencia $referencia): JsonResponse
    {
        // Limpiar el articulo_id si apuntaba a este artículo
        if ($referencia->articulo_id === $articulo->id) {
            $referencia->update(['articulo_id' => null]);
        }

        $articulo->referencias()->detach($referencia->id);

        return response()->json([
            'message' => 'Referencia desasociada exitosamente',
            'data' => $articulo->fresh()->load(['referencias.marca', 'referenciasDirectas.marca', 'articuloJuegos.referencia.marca']),
        ]);
    }

    /**
     * Agregar una referencia al juego (kit)
     */
    public function addJuego(Request $request, Articulo $articulo): JsonResponse
    {
        $request->validate([
            'referencia_id' => 'required|exists:referencias,id',
            'cantidad' => 'required|integer|min:1',
            'comentario' => 'nullable|string',
        ]);

        $juego = $articulo->articuloJuegos()->create([
            'referencia_id' => $request->referencia_id,
            'cantidad' => $request->cantidad,
            'comentario' => $request->comentario,
        ]);

        return response()->json([
            'message' => 'Componente agregado al juego exitosamente',
            'data' => $articulo->fresh()->load('articuloJuegos.referencia'),
        ]);
    }

    /**
     * Eliminar una referencia del juego (kit)
     */
    public function removeJuego(Articulo $articulo, $referenciaId): JsonResponse
    {
        $articulo->articuloJuegos()->where('referencia_id', $referenciaId)->delete();

        return response()->json([
            'message' => 'Componente eliminado del juego exitosamente',
            'data' => $articulo->fresh()->load('articuloJuegos.referencia'),
        ]);
    }

    /**
     * Agregar una medida técnica
     */
    public function addMedida(Request $request, Articulo $articulo): JsonResponse
    {
        $validated = $request->validate([
            'identificador' => 'required|string',
            'nombre' => 'required|string',
            'unidad' => 'required|string',
            'valor' => 'required|string',
            'tipo' => 'required|string',
            'imagen' => 'nullable|string',
        ]);

        $medida = $articulo->medidas()->create($validated);

        return response()->json([
            'message' => 'Medida técnica agregada exitosamente',
            'data' => $articulo->fresh()->load('medidas'),
        ]);
    }

    /**
     * Actualizar una medida técnica
     */
    public function updateMedida(Request $request, Articulo $articulo, Medida $medida): JsonResponse
    {
        $validated = $request->validate([
            'identificador' => 'sometimes|string',
            'nombre' => 'sometimes|string',
            'unidad' => 'sometimes|string',
            'valor' => 'sometimes|string',
            'tipo' => 'sometimes|string',
            'imagen' => 'nullable|string',
        ]);

        $medida->update($validated);

        return response()->json([
            'message' => 'Medida técnica actualizada exitosamente',
            'data' => $articulo->fresh()->load('medidas'),
        ]);
    }

    /**
     * Eliminar una medida técnica
     */
    public function removeMedida(Articulo $articulo, Medida $medida): JsonResponse
    {
        $medida->delete();

        return response()->json([
            'message' => 'Medida técnica eliminada exitosamente',
            'data' => $articulo->fresh()->load('medidas'),
        ]);
    }
}
