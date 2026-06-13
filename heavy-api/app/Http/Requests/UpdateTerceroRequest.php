<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
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
     * Prepara los datos para la validación.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('maquina_id')) {
            $maquinaId = $this->input('maquina_id');
            if ($maquinaId === null || $maquinaId === '' || $maquinaId === 'null' || $maquinaId === 'undefined') {
                $this->merge(['maquina_id' => []]);
            } elseif (is_string($maquinaId) || is_numeric($maquinaId)) {
                $this->merge(['maquina_id' => [intval($maquinaId)]]);
            }
        }
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Get the ID of the tercero being updated from the route (usually 'tercero')
        $terceroId = $this->route('tercero')->id;

        return [
            'tipo_documento' => ['nullable', Rule::in(['NIT', 'CC', 'CE', 'Pasaporte'])],
            // Ignore unique rule for the current record
            'numero_documento' => ['nullable', 'string', 'max:50', Rule::unique('terceros', 'numero_documento')->ignore($terceroId)],
            'nombre' => ['required', 'string', 'max:255'],
            'tipo' => ['required', Rule::in(['Cliente', 'Proveedor', 'Ambos'])],

            // Contact info
            'email' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string', 'max:255'],

            // Location keys
            'country_id' => ['nullable', 'integer'],
            'state_id' => ['nullable', 'integer'],
            'city_id' => ['nullable', 'integer'],

            // Other fields
            'forma_pago' => ['nullable', 'string'],
            'email_factura_electronica' => ['nullable', 'email'],
            'sitio_web' => ['nullable', 'string'],
            'dv' => ['nullable', 'string', 'max:1'],
            'estado' => ['nullable', Rule::in(['Activo', 'Inactivo'])],

            // Files (pueden ser archivos binarios o strings con el path ya subido asíncronamente)
            'rut' => ['nullable', function ($attribute, $value, $fail) {
                if (!is_string($value) && !($value instanceof \Illuminate\Http\UploadedFile)) {
                    $fail("El campo $attribute debe ser un archivo o un path de archivo válido.");
                }
            }],
            'certificacion_bancaria' => ['nullable', function ($attribute, $value, $fail) {
                if (!is_string($value) && !($value instanceof \Illuminate\Http\UploadedFile)) {
                    $fail("El campo $attribute debe ser un archivo o un path de archivo válido.");
                }
            }],
            'camara_comercio' => ['nullable', function ($attribute, $value, $fail) {
                if (!is_string($value) && !($value instanceof \Illuminate\Http\UploadedFile)) {
                    $fail("El campo $attribute debe ser un archivo o un path de archivo válido.");
                }
            }],
            'cedula_representante_legal' => ['nullable', function ($attribute, $value, $fail) {
                if (!is_string($value) && !($value instanceof \Illuminate\Http\UploadedFile)) {
                    $fail("El campo $attribute debe ser un archivo o un path de archivo válido.");
                }
            }],

            // Relations
            'maquina_id' => ['nullable', 'array'],
            'maquina_id.*' => [
                'integer',
                'exists:maquinas,id',
                function ($attribute, $value, $fail) use ($terceroId) {
                    $alreadyAssigned = DB::table('tercero_maquina')
                        ->where('maquina_id', $value)
                        ->where('tercero_id', '!=', $terceroId)
                        ->exists();

                    if ($alreadyAssigned) {
                        $fail('La máquina seleccionada ya está asignada a otro tercero.');
                    }
                },
            ],
            'fabricante_id' => ['nullable', 'array'],
            'sistema_id' => ['nullable', 'array'],
            'categoria_comercial_id' => ['nullable', 'array'],
            'categoria_comercial_id.*' => ['integer'],

            // Contactos
            'contactos' => ['nullable', 'array'],
            'contactos.*.id' => ['nullable', 'integer', 'exists:contactos,id'],
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
