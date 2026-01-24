<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para crear una nueva TRM
 *
 * Valida los datos de entrada para la creación de TRM
 * y define reglas de autorización.
 */
class StoreTRMRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\TRM::class)
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
            'trm' => ['required', 'numeric', 'min:0'],
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
            'trm.required' => 'La TRM es obligatoria',
            'trm.numeric' => 'La TRM debe ser un número',
            'trm.min' => 'La TRM debe ser mayor o igual a 0',
        ];
    }
}
