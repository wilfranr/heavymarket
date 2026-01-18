<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * Form Request para registro de nuevos usuarios
 * 
 * Valida los datos necesarios para crear una nueva cuenta.
 */
class RegisterRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     * 
     * El registro es público, por lo que siempre retorna true.
     * En producción, podrías restringir esto según tus reglas de negocio.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación que aplican a la petición.
     * 
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()],
            'password_confirmation' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Mensajes de error personalizados
     * 
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio',
            'email.required' => 'El email es obligatorio',
            'email.email' => 'El email debe ser válido',
            'email.unique' => 'Este email ya está registrado',
            'password.required' => 'La contraseña es obligatoria',
            'password.confirmed' => 'Las contraseñas no coinciden',
            'password_confirmation.required' => 'Debes confirmar la contraseña',
        ];
    }

    /**
     * Obtener el nombre del dispositivo para el token
     */
    public function getDeviceName(): string
    {
        return $this->input('device_name', request()->userAgent() ?? 'unknown');
    }
}
