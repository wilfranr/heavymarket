<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Contacto;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para crear un nuevo Contacto
 *
 * Valida los datos de entrada para la creación de contactos
 * y define reglas de autorización.
 */
class StoreContactoRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Contacto::class)
            || $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Vendedor']);
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tercero_id' => ['required', 'integer', 'exists:terceros,id'],
            'nombre' => ['required', 'string', 'max:255'],
            'cargo' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'indicativo' => ['nullable', 'string', 'max:10'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'email' => ['nullable', 'email', 'max:255'],
            'principal' => ['nullable', 'boolean'],
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
            'tercero_id.required' => 'El tercero es obligatorio',
            'tercero_id.exists' => 'El tercero seleccionado no existe',
            'nombre.required' => 'El nombre es obligatorio',
            'email.email' => 'El email debe tener un formato válido',
        ];
    }
}
