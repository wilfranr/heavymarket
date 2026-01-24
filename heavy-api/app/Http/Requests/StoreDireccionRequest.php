<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para crear una nueva Dirección
 *
 * Valida los datos de entrada para la creación de direcciones
 * y define reglas de autorización.
 */
class StoreDireccionRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Direccion::class)
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
            'tercero_id' => ['required', 'integer', 'exists:terceros,id'],
            'direccion' => ['required', 'string', 'max:500'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'principal' => ['nullable', 'boolean'],
            'destinatario' => ['nullable', 'string', 'max:255'],
            'nit_cc' => ['nullable', 'string', 'max:50'],
            'transportadora_id' => ['nullable', 'integer', 'exists:transportadoras,id'],
            'forma_pago' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'ciudad_texto' => ['nullable', 'string', 'max:255'],
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
            'direccion.required' => 'La dirección es obligatoria',
        ];
    }
}
