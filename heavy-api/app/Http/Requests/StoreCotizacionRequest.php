<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para crear una nueva Cotización
 *
 * Valida los datos de entrada para la creación de cotizaciones
 * y define reglas de autorización.
 */
class StoreCotizacionRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Cotizacion::class)
            || $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Vendedor']);
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'pedido_id' => ['required', 'integer', 'exists:pedidos,id'],
            'tercero_id' => ['required', 'integer', 'exists:terceros,id'],
            'estado' => [
                'nullable',
                Rule::in(['Pendiente', 'Enviada', 'Aprobada', 'Rechazada', 'Vencida', 'En_Proceso']),
            ],
            'fecha_vencimiento' => ['nullable', 'date', 'after:today'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
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
            'pedido_id.required' => 'El pedido es obligatorio',
            'pedido_id.exists' => 'El pedido seleccionado no existe',
            'tercero_id.required' => 'El tercero es obligatorio',
            'tercero_id.exists' => 'El tercero seleccionado no existe',
            'estado.in' => 'El estado seleccionado no es válido',
            'fecha_vencimiento.after' => 'La fecha de vencimiento debe ser posterior a hoy',
        ];
    }

    /**
     * Prepara los datos para validación
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'user_id' => $this->user()->id,
            'estado' => $this->input('estado', 'En_Proceso'),
        ]);
    }
}
