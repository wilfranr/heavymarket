<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTerceroRequest;
use App\Http\Requests\UpdateTerceroRequest;
use App\Http\Resources\TerceroResource;
use App\Models\Tercero;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
/**
 * Controlador API para gestión de Terceros
 *
 * Maneja operaciones CRUD para clientes y proveedores.
 * Cuando landing_access=true, crea/actualiza un User vinculado con rol 'Cliente'
 * para permitir el inicio de sesión en la landing page.
 */
use Spatie\Permission\Models\Role;

class TerceroController extends Controller
{
    use AuthorizesRequests;

    /**
     * Listar todos los terceros con filtros
     */
    public function index(Request $request): JsonResponse
    {
        $query = Tercero::with(['country', 'sistemas', 'categoriasComerciales', 'fabricantes']);

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }

        if ($request->filled('es_cliente')) {
            if ($request->input('es_cliente')) {
                $query->whereIn('tipo', ['Cliente', 'Ambos']);
            }
        }
        if ($request->filled('es_proveedor')) {
            if ($request->input('es_proveedor')) {
                $query->whereIn('tipo', ['Proveedor', 'Ambos']);
            }
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('numero_documento', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->input('sort_by', 'nombre');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = (int) $request->input('per_page', 15);
        $terceros = $query->paginate($perPage);

        return response()->json([
            'data' => TerceroResource::collection($terceros),
            'meta' => [
                'current_page' => $terceros->currentPage(),
                'last_page' => $terceros->lastPage(),
                'per_page' => $terceros->perPage(),
                'total' => $terceros->total(),
            ],
        ]);
    }

    /**
     * Crear un nuevo tercero
     */
    public function store(StoreTerceroRequest $request): JsonResponse
    {
        $this->authorize('create', Tercero::class);

        return DB::transaction(function () use ($request) {
            try {
                $data = $request->validated();
                $categoriaComercialIds = Arr::pull($data, 'categoria_comercial_id', []);

                // Handle Files
                $fileFields = ['rut', 'certificacion_bancaria', 'camara_comercio', 'cedula_representante_legal'];
                foreach ($fileFields as $field) {
                    if ($request->hasFile($field)) {
                        $data[$field] = $request->file($field)->store('terceros/documentos', 'public');
                    }
                }

                // Extraer el campo landing_password (no va a la tabla terceros)
                $landingPassword = $request->input('landing_password');
                $landingAccess = filter_var($data['landing_access'] ?? false, FILTER_VALIDATE_BOOLEAN);
                $data['landing_access'] = $landingAccess;

                $tercero = Tercero::create($data);

                // Handle Contacts
                if ($request->filled('contactos')) {
                    foreach ($request->input('contactos') as $contactoData) {
                        $tercero->contactos()->create($contactoData);
                    }
                }

                // Handle Relationships
                if ($request->filled('maquina_id')) {
                    $tercero->maquinas()->sync($request->input('maquina_id'));
                }
                if ($request->filled('fabricante_id')) {
                    $tercero->fabricantes()->sync($request->input('fabricante_id'));
                }
                if ($request->filled('sistema_id')) {
                    $tercero->sistemas()->sync($request->input('sistema_id'));
                }
                if (! empty($categoriaComercialIds)) {
                    $tercero->categoriasComerciales()->sync($categoriaComercialIds);
                }

                return response()->json([
                    'data' => new TerceroResource($tercero->load(['maquinas', 'fabricantes', 'sistemas', 'contactos', 'categoriasComerciales'])),
                    'message' => 'Tercero creado exitosamente',
                ], 201);

            } catch (\Exception $e) {
                Log::error('Error creating tercero: '.$e->getMessage());

                return response()->json([
                    'message' => 'Error al crear el tercero',
                    'error' => $e->getMessage(),
                ], 500);
            }
        });
    }

    /**
     * Mostrar un tercero específico
     */
    public function show(Tercero $tercero): JsonResponse
    {
        $tercero->load(['contactos', 'direcciones', 'fabricantes', 'sistemas', 'maquinas.fabricante', 'maquinas.componentes.sistema', 'maquinas.componentes.marca', 'categoriasComerciales', 'city', 'state', 'country']);

        return response()->json([
            'data' => new TerceroResource($tercero),
        ]);
    }

    /**
     * Actualizar un tercero existente
     */
    public function update(UpdateTerceroRequest $request, Tercero $tercero): JsonResponse
    {
        $this->authorize('update', $tercero);

        return DB::transaction(function () use ($request, $tercero) {
            try {
                $data = $request->validated();

                // Handle Files
                $fileFields = ['rut', 'certificacion_bancaria', 'camara_comercio', 'cedula_representante_legal'];
                foreach ($fileFields as $field) {
                    if ($request->hasFile($field)) {
                        if ($tercero->{$field}) {
                            Storage::disk('public')->delete($tercero->{$field});
                        }
                        $data[$field] = $request->file($field)->store('terceros/documentos', 'public');
                    }
                }

                // Extraer campos de acceso landing
                $landingAccess = isset($data['landing_access'])
                    ? filter_var($data['landing_access'], FILTER_VALIDATE_BOOLEAN)
                    : $tercero->landing_access;
                $landingPassword = $request->input('landing_password');
                $data['landing_access'] = $landingAccess;

                $tercero->update($data);

                // Handle Contacts
                if ($request->has('contactos')) {
                    $contactosInput = $request->input('contactos', []);
                    $keepIds = collect($contactosInput)->pluck('id')->filter()->all();

                    $tercero->contactos()->whereNotIn('id', $keepIds)->delete();

                    foreach ($contactosInput as $contactoData) {
                        if (isset($contactoData['id'])) {
                            $tercero->contactos()->where('id', $contactoData['id'])->update(Arr::except($contactoData, ['id']));
                        } else {
                            $tercero->contactos()->create($contactoData);
                        }
                    }
                }

                // Handle Relationships
                if ($request->has('maquina_id')) {
                    $tercero->maquinas()->sync($request->input('maquina_id'));
                }
                if ($request->has('fabricante_id')) {
                    $tercero->fabricantes()->sync($request->input('fabricante_id'));
                }
                if ($request->has('sistema_id')) {
                    $tercero->sistemas()->sync($request->input('sistema_id'));
                }
                if ($request->has('categoria_comercial_id')) {
                    $tercero->categoriasComerciales()->sync($request->input('categoria_comercial_id', []));
                }

                // Gestionar acceso a la landing
                if ($landingAccess && $tercero->email) {
                    $this->syncLandingUser($tercero, $landingPassword ?: null);
                } elseif (! $landingAccess && $tercero->user_id) {
                    // Desactivar acceso: desvincular el user sin borrarlo
                    $tercero->updateQuietly(['user_id' => null]);
                }

                return response()->json([
                    'data' => new TerceroResource($tercero->load(['contactos', 'maquinas', 'fabricantes', 'sistemas', 'categoriasComerciales'])),
                    'message' => 'Tercero actualizado exitosamente',
                ]);

            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Error al actualizar el tercero',
                    'error' => $e->getMessage(),
                ], 500);
            }
        });
    }

    /**
     * Eliminar un tercero
     */
    public function destroy(Tercero $tercero): JsonResponse
    {
        $this->authorize('delete', $tercero);
        try {
            $fileFields = ['rut', 'certificacion_bancaria', 'camara_comercio', 'cedula_representante_legal'];
            foreach ($fileFields as $field) {
                if ($tercero->{$field}) {
                    Storage::disk('public')->delete($tercero->{$field});
                }
            }

            $tercero->delete();

            return response()->json([
                'message' => 'Tercero eliminado exitosamente',
            ], 204);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar el tercero',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sincronizar (crear o actualizar) el User de landing vinculado al tercero.
     *
     * - Si el tercero ya tiene user_id, actualiza ese User.
     * - Si no, busca por email o crea uno nuevo.
     * - Siempre asegura que el User tenga el rol 'Cliente'.
     * - Vincula user_id al tercero si no estaba vinculado.
     */
    private function syncLandingUser(Tercero $tercero, ?string $password): void
    {
        $user = $tercero->user_id
            ? User::find($tercero->user_id)
            : User::where('email', $tercero->email)->first();

        if ($user) {
            $user->name = $tercero->nombre;
            $user->email = $tercero->email;
            if ($password) {
                $user->password = Hash::make($password);
            }
            $user->save();
        } else {
            $user = User::create([
                'name' => $tercero->nombre,
                'email' => $tercero->email,
                'password' => Hash::make($password ?? Str::random(16)),
            ]);
        }

        // Garantizar que el rol 'Cliente' existe antes de asignarlo
        // (protección defensiva por si la migración no se corrió aún en el entorno)
        Role::firstOrCreate(['name' => 'Cliente', 'guard_name' => 'web']);

        if (! $user->hasRole('Cliente')) {
            $user->assignRole('Cliente');
        }

        if ($tercero->user_id !== $user->id) {
            $tercero->updateQuietly(['user_id' => $user->id]);
        }
    }
}
