<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tercero;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Controlador de Autenticación para Proveedores
 *
 * Maneja el registro y login específico para la entidad de proveedores.
 */
class ProviderAuthController extends Controller
{
    /**
     * Registro de un nuevo proveedor.
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        return DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            // Asignar rol de Proveedor (Spatie)
            $user->assignRole('Proveedor');

            // Crear el registro de Tercero vinculado al usuario con acceso a portal
            Tercero::create([
                'nombre' => $request->name,
                'email' => $request->email,
                'tipo' => 'Proveedor',
                'estado' => 'Activo',
                'user_id' => $user->id,
                'provider_access' => true,
            ]);

            $token = $user->createToken('provider_auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Proveedor registrado exitosamente',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                ],
                'token' => $token,
            ], 201);
        });
    }

    /**
     * Login de proveedor.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        // Verificar si tiene el rol de Proveedor
        if (! $user->hasRole('Proveedor')) {
            return response()->json([
                'message' => 'Acceso denegado. Este usuario no tiene perfil de proveedor.',
            ], 403);
        }

        // Verificar acceso habilitado en tabla terceros
        $tercero = Tercero::where('user_id', $user->id)->first();
        if (! $tercero || ! $tercero->provider_access) {
            return response()->json([
                'message' => 'Su acceso al portal de proveedores aún no ha sido habilitado.',
            ], 403);
        }

        $token = $user->createToken('provider_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Inicio de sesión exitoso',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
            ],
            'token' => $token,
        ]);
    }
}
