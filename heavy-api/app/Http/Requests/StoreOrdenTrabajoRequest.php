<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para crear una nueva Orden de Trabajo
 *
 * Valida los datos de entrada para la creación de órdenes de trabajo
 * y define reglas de autorización.
 */
class StoreOrdenTrabajoRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\OrdenTrabajo::class)
            || $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Logistica']);
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tercero_id' => ['nullable', 'integer', 'exists:terceros,id'],
            'pedido_id' => ['nullable', 'integer', 'exists:pedidos,id'],
            'cotizacion_id' => ['nullable', 'integer', 'exists:cotizaciones,id'],
            'estado' => [
                'nullable',
                Rule::in(['Pendiente', 'En Proceso', 'Completado', 'Cancelado']),
            ],
            'fecha_ingreso' => ['required', 'date'],
            'fecha_entrega' => ['nullable', 'date', 'after_or_equal:fecha_ingreso'],
            'direccion_id' => ['nullable', 'integer', 'exists:direcciones,id'],
            'telefono' => ['required', 'string', 'max:255'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
            'guia' => ['nullable', 'string', 'max:255'],
            'transportadora_id' => ['nullable', 'integer', 'exists:transportadoras,id'],
            'archivo' => ['nullable', 'string', 'max:255'],
            'motivo_cancelacion' => ['nullable', 'string', 'max:500'],
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
            'fecha_ingreso.required' => 'La fecha de ingreso es obligatoria',
            'fecha_entrega.after_or_equal' => 'La fecha de entrega debe ser posterior o igual a la fecha de ingreso',
            'telefono.required' => 'El teléfono es obligatorio',
            'estado.in' => 'El estado seleccionado no es válido',
        ];
    }

    /**
     * Prepara los datos para validación
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'user_id' => $this->user()->id,
            'estado' => $this->input('estado', 'Pendiente'),
        ]);
    }
}
