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
 * Sincroniza usuarios vinculados según landing_access (rol Cliente) y
 * provider_access (rol Proveedor) según el tipo comercial del tercero.
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

                // Extraer contraseña de portal (no persiste en terceros)
                $portalPassword = $request->input('landing_password');
                [$landingAccess, $providerAccess] = $this->normalizePortalAccessFlags(
                    $data['tipo'],
                    filter_var($data['landing_access'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    filter_var($data['provider_access'] ?? false, FILTER_VALIDATE_BOOLEAN)
                );
                $data['landing_access'] = $landingAccess;
                $data['provider_access'] = $providerAccess;

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

                if ($tercero->email && ($landingAccess || $providerAccess)) {
                    $this->syncTerceroPortalAccess($tercero->fresh(), $portalPassword ?: null);
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

                // Extraer campos de acceso a portales
                $portalPassword = $request->input('landing_password');
                [$landingAccess, $providerAccess] = $this->normalizePortalAccessFlags(
                    $data['tipo'],
                    isset($data['landing_access'])
                        ? filter_var($data['landing_access'], FILTER_VALIDATE_BOOLEAN)
                        : (bool) $tercero->landing_access,
                    isset($data['provider_access'])
                        ? filter_var($data['provider_access'], FILTER_VALIDATE_BOOLEAN)
                        : (bool) $tercero->provider_access
                );
                $data['landing_access'] = $landingAccess;
                $data['provider_access'] = $providerAccess;

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

                // Gestionar accesos a landing y portal de proveedores
                $this->syncTerceroPortalAccess($tercero->fresh(), $portalPassword ?: null);

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
     * Normaliza flags de acceso según el tipo comercial del tercero.
     *
     * @return array{0: bool, 1: bool}
     */
    private function normalizePortalAccessFlags(string $tipo, bool $landingAccess, bool $providerAccess): array
    {
        return match ($tipo) {
            'Cliente' => [$landingAccess, false],
            'Proveedor' => [false, $providerAccess],
            default => [$landingAccess, $providerAccess],
        };
    }

    /**
     * Sincroniza el usuario vinculado y los roles según los accesos habilitados.
     */
    private function syncTerceroPortalAccess(Tercero $tercero, ?string $password): void
    {
        [$wantsLanding, $wantsProvider] = $this->normalizePortalAccessFlags(
            $tercero->tipo,
            (bool) $tercero->landing_access,
            (bool) $tercero->provider_access
        );

        if ($tercero->landing_access !== $wantsLanding || $tercero->provider_access !== $wantsProvider) {
            $tercero->updateQuietly([
                'landing_access' => $wantsLanding,
                'provider_access' => $wantsProvider,
            ]);
        }

        if (! $wantsLanding && ! $wantsProvider) {
            if ($tercero->user_id) {
                $user = User::find($tercero->user_id);
                if ($user) {
                    if ($user->hasRole('Cliente')) {
                        $user->removeRole('Cliente');
                    }
                    if ($user->hasRole('Proveedor')) {
                        $user->removeRole('Proveedor');
                    }
                }
                $tercero->updateQuietly(['user_id' => null]);
            }

            return;
        }

        if (! $tercero->email) {
            return;
        }

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

        Role::firstOrCreate(['name' => 'Cliente', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Proveedor', 'guard_name' => 'web']);

        if ($wantsLanding) {
            if (! $user->hasRole('Cliente')) {
                $user->assignRole('Cliente');
            }
        } elseif ($user->hasRole('Cliente')) {
            $user->removeRole('Cliente');
        }

        if ($wantsProvider) {
            if (! $user->hasRole('Proveedor')) {
                $user->assignRole('Proveedor');
            }
        } elseif ($user->hasRole('Proveedor')) {
            $user->removeRole('Proveedor');
        }

        if ($tercero->user_id !== $user->id) {
            $tercero->updateQuietly(['user_id' => $user->id]);
        }
    }

    /**
     * Cargar un documento de tercero de forma asíncrona.
     */
    public function uploadDocumento(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:5120', 'mimes:pdf,png,jpeg,jpg'],
        ]);

        try {
            $file = $request->file('file');
            $path = $file->store('terceros/documentos', 'public');

            return response()->json([
                'success' => true,
                'file_url' => Storage::url($path),
                'file_name' => $path,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error uploading documento tercero: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al subir el archivo',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
