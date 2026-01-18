<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para actualizar un Tercero existente
 */
class UpdateTerceroRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Vendedor']);
    }

    /**
     * Reglas de validación que aplican a la petición.
     * 
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $terceroId = $this->route('tercero')->id;

        return [
            'tipo_documento' => ['sometimes', 'required', Rule::in(['NIT', 'CC', 'CE', 'Pasaporte'])],
            'documento' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('terceros', 'documento')->ignore($terceroId)
            ],
            'razon_social' => ['sometimes', 'required', 'string', 'max:255'],
            'nombre_comercial' => ['nullable', 'string', 'max:255'],
            'tipo_tercero' => ['sometimes', 'required', Rule::in(['Natural', 'Juridico'])],
            'email' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'celular' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'ciudad' => ['nullable', 'string', 'max:100'],
            'pais' => ['nullable', 'string', 'max:100'],
            'es_cliente' => ['boolean'],
            'es_proveedor' => ['boolean'],
            'estado' => ['nullable', Rule::in(['Activo', 'Inactivo'])],
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
            'documento.unique' => 'Ya existe un tercero con este documento',
            'tipo_documento.in' => 'El tipo de documento no es válido',
            'tipo_tercero.in' => 'El tipo de tercero no es válido',
            'email.email' => 'El email no tiene un formato válido',
        ];
    }
}
