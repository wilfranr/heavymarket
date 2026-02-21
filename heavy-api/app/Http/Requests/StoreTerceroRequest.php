<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para crear un nuevo Tercero
 */
class StoreTerceroRequest extends FormRequest
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
        return [
            'tipo_documento' => ['nullable', Rule::in(['NIT', 'CC', 'CE', 'Pasaporte'])],
            'numero_documento' => ['nullable', 'string', 'max:50', 'unique:terceros,numero_documento'],
            'nombre' => ['required', 'string', 'max:255'],
            'tipo' => ['required', Rule::in(['Cliente', 'Proveedor', 'Ambos'])],

            // Contact info
            'email' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string', 'max:255'],

            // Location keys (IDs preferred if passed, but basic validation here)
            'country_id' => ['nullable', 'integer'],
            'state_id' => ['nullable', 'integer'],
            'city_id' => ['nullable', 'integer'],

            // Other fields
            'forma_pago' => ['nullable', 'string'],
            'email_factura_electronica' => ['nullable', 'email'],
            'sitio_web' => ['nullable', 'string'],
            'dv' => ['nullable', 'string', 'max:1'],
            'estado' => ['nullable', Rule::in(['Activo', 'Inactivo'])],

            // Files
            'rut' => ['nullable', 'file', 'max:5120'], // 5MB
            'certificacion_bancaria' => ['nullable', 'file', 'max:5120'],
            'camara_comercio' => ['nullable', 'file', 'max:5120'],
            'cedula_representante_legal' => ['nullable', 'file', 'max:5120'],

            // Relations
            'maquina_id' => ['nullable', 'array'],
            'maquina_id.*' => ['integer', 'exists:maquinas,id'],
            'fabricante_id' => ['nullable', 'array'],
            'sistema_id' => ['nullable', 'array'],

            // Contactos
            'contactos' => ['nullable', 'array'],
            'contactos.*.nombre' => ['required_with:contactos', 'string', 'max:255'],
            'contactos.*.cargo' => ['nullable', 'string', 'max:255'],
            'contactos.*.telefono' => ['nullable', 'string', 'max:50'],
            'contactos.*.email' => ['nullable', 'email', 'max:255'],
            'contactos.*.principal' => ['nullable', 'boolean'],

            // Acceso Landing
            'landing_access' => ['nullable', 'boolean'],
            'landing_password' => ['nullable', 'string', 'min:6'],
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
            'numero_documento.required' => 'El número de documento es obligatorio',
            'numero_documento.unique' => 'Ya existe un tercero con este documento',
            'nombre.required' => 'El nombre es obligatorio',
            'tipo_documento.in' => 'El tipo de documento no es válido',
            'tipo.required' => 'El tipo de tercero es obligatorio',
            'tipo.in' => 'El tipo de tercero no es válido',
            'email.email' => 'El email no tiene un formato válido',
        ];
    }
}
