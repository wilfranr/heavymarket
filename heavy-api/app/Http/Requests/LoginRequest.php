<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para autenticación (Login)
 * 
 * Valida las credenciales de acceso del usuario.
 */
class LoginRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     * 
     * Login es público, por lo que siempre retorna true.
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
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:6'],
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
            'email.required' => 'El email es obligatorio',
            'email.email' => 'El email debe ser válido',
            'password.required' => 'La contraseña es obligatoria',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres',
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
