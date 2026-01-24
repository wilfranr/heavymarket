<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para crear una nueva Transportadora
 *
 * Valida los datos de entrada para la creación de transportadoras
 * y define reglas de autorización.
 */
class StoreTransportadoraRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Transportadora::class)
            || $this->user()->hasAnyRole(['super_admin', 'Administrador']);
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255'],
            'nit' => ['nullable', 'string', 'max:50', 'unique:transportadoras,nit'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string', 'max:500'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'email' => ['nullable', 'email', 'max:255'],
            'contacto' => ['nullable', 'string', 'max:255'],
            'celular' => ['nullable', 'string', 'max:50'],
            'observaciones' => ['nullable', 'string'],
            'logo' => ['nullable', 'string', 'max:500'],
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
            'nombre.required' => 'El nombre es obligatorio',
            'nit.unique' => 'Ya existe una transportadora con ese NIT',
            'email.email' => 'El email debe tener un formato válido',
        ];
    }
}
