<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\{LoginRequest, RegisterRequest};
use App\Models\User;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\{Auth, Hash};
use Illuminate\Validation\ValidationException;

/**
 * Controlador de Autenticación
 * 
 * Maneja el registro, login, logout y gestión de tokens
 * de autenticación usando Laravel Sanctum.
 */
class AuthController extends Controller
{
    /**
     * Registrar un nuevo usuario
     * 
     * @param RegisterRequest $request
     * @return JsonResponse
     * 
     * @bodyParam name string required Nombre completo del usuario. Example: Juan Pérez
     * @bodyParam email string required Email único del usuario. Example: juan@example.com
     * @bodyParam password string required Contraseña (mínimo 8 caracteres, mixta). Example: Password123!
     * @bodyParam password_confirmation string required Confirmación de contraseña. Example: Password123!
     * @bodyParam device_name string optional Nombre del dispositivo. Example: iPhone 13
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            // Crear el usuario
            $user = User::create([
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'password' => $request->input('password'), // Se hashea automáticamente
            ]);

            // Asignar rol por defecto
            $user->assignRole('panel_user');

            // Crear token de acceso
            $token = $user->createToken(
                $request->getDeviceName(),
                ['*'], // Todos los permisos
                now()->addDays(30) // Expira en 30 días
            )->plainTextToken;

            return response()->json([
                'message' => 'Usuario registrado exitosamente',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'roles' => $user->roles->pluck('name'),
                    ],
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => 30 * 24 * 60 * 60, // 30 días en segundos
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al registrar el usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Iniciar sesión
     * 
     * @param LoginRequest $request
     * @return JsonResponse
     * 
     * @bodyParam email string required Email del usuario. Example: admin@heavymarket.com
     * @bodyParam password string required Contraseña. Example: password
     * @bodyParam device_name string optional Nombre del dispositivo. Example: Chrome Browser
     */
    public function login(LoginRequest $request): JsonResponse
    {
        // Buscar usuario por email
        $user = User::where('email', $request->input('email'))->first();

        // Verificar si el usuario existe y la contraseña es correcta
        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        // Crear token de acceso
        $token = $user->createToken(
            $request->getDeviceName(),
            ['*'], // Todos los permisos
            now()->addDays(30) // Expira en 30 días
        )->plainTextToken;

        return response()->json([
            'message' => 'Inicio de sesión exitoso',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('name'),
                    'permissions' => $user->permissions->pluck('name'),
                ],
                'access_token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => 30 * 24 * 60 * 60, // 30 días en segundos
            ],
        ]);
    }

    /**
     * Cerrar sesión (revocar token actual)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        // Revocar el token actual
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente',
        ]);
    }

    /**
     * Cerrar sesión en todos los dispositivos
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function logoutAll(Request $request): JsonResponse
    {
        // Revocar todos los tokens del usuario
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Se han cerrado todas las sesiones',
        ]);
    }

    /**
     * Obtener información del usuario autenticado
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at?->toISOString(),
                'created_at' => $user->created_at->toISOString(),
                'roles' => $user->roles->pluck('name'),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    }

    /**
     * Refrescar token (crear nuevo token y revocar el actual)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Revocar token actual
        $request->user()->currentAccessToken()->delete();

        // Crear nuevo token
        $token = $user->createToken(
            $request->userAgent() ?? 'unknown',
            ['*'],
            now()->addDays(30)
        )->plainTextToken;

        return response()->json([
            'message' => 'Token refrescado exitosamente',
            'data' => [
                'access_token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => 30 * 24 * 60 * 60,
            ],
        ]);
    }

    /**
     * Listar tokens activos del usuario
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function tokens(Request $request): JsonResponse
    {
        $tokens = $request->user()->tokens->map(function ($token) {
            return [
                'id' => $token->id,
                'name' => $token->name,
                'last_used_at' => $token->last_used_at?->toISOString(),
                'created_at' => $token->created_at->toISOString(),
                'expires_at' => $token->expires_at?->toISOString(),
            ];
        });

        return response()->json([
            'data' => $tokens,
            'total' => $tokens->count(),
        ]);
    }

    /**
     * Revocar un token específico
     * 
     * @param Request $request
     * @param string $tokenId
     * @return JsonResponse
     */
    public function revokeToken(Request $request, string $tokenId): JsonResponse
    {
        $deleted = $request->user()->tokens()
            ->where('id', $tokenId)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'message' => 'Token no encontrado',
            ], 404);
        }

        return response()->json([
            'message' => 'Token revocado exitosamente',
        ]);
    }
}
