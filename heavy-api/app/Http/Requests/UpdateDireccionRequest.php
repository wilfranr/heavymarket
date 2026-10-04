<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para actualizar una Dirección existente
 */
class UpdateDireccionRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tercero_id' => ['sometimes', 'integer', 'exists:terceros,id'],
            'direccion' => ['sometimes', 'string', 'max:500'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'state_id' => ['nullable', 'integer', 'exists:states,id'],
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'principal' => ['nullable', 'boolean'],
            'destinatario' => ['nullable', 'string', 'max:255'],
            'nit_cc' => ['nullable', 'string', 'max:50'],
            'transportadora_id' => ['nullable', 'integer', 'exists:transportadoras,id'],
            'forma_pago' => ['nullable', Rule::in(['Al cobro', 'Pagamos'])],
            'telefono' => ['nullable', 'string', 'max:50'],
            'correo' => ['nullable', 'email', 'max:255'],
            'ciudad_texto' => ['nullable', 'string', 'max:255'],
        ];
    }
}
