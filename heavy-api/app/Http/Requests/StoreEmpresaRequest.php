<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para crear una nueva Empresa
 *
 * Valida los datos de entrada para la creación de empresas
 * y define reglas de autorización.
 */
class StoreEmpresaRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Empresa::class)
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
            'nombre' => ['required', 'string', 'max:300', 'unique:empresas,nombre'],
            'siglas' => ['nullable', 'string', 'max:10'],
            'direccion' => ['required', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'celular' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:empresas,email'],
            'nit' => ['required', 'string', 'max:255', 'unique:empresas,nit'],
            'representante' => ['required', 'string', 'max:255'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'estado' => ['nullable', 'boolean'],
            'flete' => ['nullable', 'numeric', 'min:0'],
            'trm' => ['nullable', 'numeric', 'min:0'],
            'logo_light' => ['nullable', 'string', 'max:255'],
            'logo_dark' => ['nullable', 'string', 'max:255'],
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
            'nombre.unique' => 'Ya existe una empresa con ese nombre',
            'direccion.required' => 'La dirección es obligatoria',
            'celular.required' => 'El celular es obligatorio',
            'email.required' => 'El email es obligatorio',
            'email.email' => 'El email debe ser válido',
            'email.unique' => 'Ya existe una empresa con ese email',
            'nit.required' => 'El NIT es obligatorio',
            'nit.unique' => 'Ya existe una empresa con ese NIT',
            'representante.required' => 'El representante es obligatorio',
        ];
    }

    /**
     * Prepara los datos para validación
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'estado' => $this->input('estado', false),
            'flete' => $this->input('flete', 2.2),
            'trm' => $this->input('trm', 0),
        ]);
    }
}
