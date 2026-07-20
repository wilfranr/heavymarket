<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para registrar recepción parcial o completa de una OC.
 */
class ReceiveOrdenCompraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('orden_compra'))
            || $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Logistica']);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'referencias' => ['required', 'array', 'min:1'],
            'referencias.*.referencia_id' => ['required', 'integer', 'exists:referencias,id'],
            'referencias.*.cantidad_recibida' => ['required', 'integer', 'min:0'],
            'notas_cierre' => ['nullable', 'string', 'max:2000'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'referencias.required' => 'Debe registrar al menos una referencia recibida',
            'referencias.*.referencia_id.required' => 'La referencia es obligatoria',
            'referencias.*.cantidad_recibida.required' => 'La cantidad recibida es obligatoria',
            'referencias.*.cantidad_recibida.min' => 'La cantidad recibida no puede ser negativa',
        ];
    }
}
