<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SocialIdentity;
use App\Models\Tercero;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class ClientAuthController extends Controller
{
    /**
     * Register a new client via email.
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

            $user->assignRole('Cliente');

            // Crear el registro de Tercero vinculado al usuario
            Tercero::create([
                'nombre' => $request->name,
                'email' => $request->email,
                'tipo' => 'Cliente',
                'estado' => 'Activo',
                'user_id' => $user->id,
            ]);

            $token = $user->createToken('client_auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Client registered successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('name'),
                ],
                'token' => $token,
            ], 201);
        });
    }

    /**
     * Login a client via email.
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
                'email' => ['Invalid credentials'],
            ]);
        }

        $token = $user->createToken('client_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
            ],
            'token' => $token,
        ]);
    }

    /**
     * Redirect to social provider.
     */
    public function redirectToProvider($provider): JsonResponse
    {
        return response()->json([
            'url' => Socialite::driver($provider)->stateless()->redirect()->getTargetUrl(),
        ]);
    }

    /**
     * Handle social provider callback.
     */
    public function handleProviderCallback($provider)
    {
        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            return response()->json(['error' => 'Unable to authenticate with '.$provider], 401);
        }

        $user = $this->findOrCreateUser($socialUser, $provider);

        $token = $user->createToken('client_social_auth_token')->plainTextToken;

        // Use env variable or default to localhost
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:4200');

        return redirect()->to($frontendUrl.'/auth/callback?token='.$token);
    }

    /**
     * Find or create user instance.
     */
    protected function findOrCreateUser($socialUser, $provider)
    {
        $socialIdentity = SocialIdentity::where('provider_name', $provider)
            ->where('provider_id', $socialUser->getId())
            ->first();

        if ($socialIdentity) {
            return $socialIdentity->user;
        }

        $user = User::where('email', $socialUser->getEmail())->first();

        if (! $user) {
            $user = User::create([
                'name' => $socialUser->getName(),
                'email' => $socialUser->getEmail(),
                'password' => Hash::make(Str::random(24)),
                'email_verified_at' => now(),
            ]);

            $user->assignRole('Cliente');
        } else {
            // If user exists but no social identity linked, link it now.
            // This assumes email trust from social provider.
            // Usually acceptable for Google/FB.
        }

        // Check if relationship exists to avoid duplicates if something went wrong
        if (! $user->socialIdentities()->where('provider_name', $provider)->where('provider_id', $socialUser->getId())->exists()) {
            $user->socialIdentities()->create([
                'provider_name' => $provider,
                'provider_id' => $socialUser->getId(),
            ]);
        }

        return $user;
    }
}
