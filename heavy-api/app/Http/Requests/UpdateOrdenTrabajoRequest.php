<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\OrdenTrabajo;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para actualizar una Orden de Trabajo
 *
 * Valida los datos de entrada para la actualización de órdenes de trabajo
 * y define reglas de autorización.
 */
class UpdateOrdenTrabajoRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', OrdenTrabajo::class)
            || $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Logistica']);
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
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
            'fecha_ingreso' => ['nullable', 'date'],
            'fecha_entrega' => ['nullable', 'date', 'after_or_equal:fecha_ingreso'],
            'direccion_id' => ['nullable', 'integer', 'exists:direcciones,id'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
            'guia' => ['nullable', 'string', 'max:255'],
            'transportadora_id' => ['nullable', 'integer', 'exists:transportadoras,id'],
            'archivo' => ['nullable', 'string', 'max:255'],
            'motivo_cancelacion' => ['nullable', 'string', 'max:500'],
            // Referencias de la orden
            'referencias' => ['nullable', 'array'],
            'referencias.*.id' => ['nullable', 'integer', 'exists:orden_trabajo_referencias,id'],
            'referencias.*.pedido_referencia_id' => ['nullable', 'integer', 'exists:pedido_referencias,id'],
            'referencias.*.cantidad' => ['nullable', 'integer', 'min:1'],
            'referencias.*.estado' => [
                'nullable',
                Rule::in(['Pendiente', 'Recibido', 'Cancelado', 'Despachado']),
            ],
            'referencias.*.recibido' => ['nullable', 'boolean'],
            'referencias.*.fecha_recepcion' => ['nullable', 'date'],
            'referencias.*.observaciones' => ['nullable', 'string', 'max:500'],
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
            'fecha_entrega.after_or_equal' => 'La fecha de entrega debe ser posterior o igual a la fecha de ingreso',
            'estado.in' => 'El estado seleccionado no es válido',
            'referencias.*.estado.in' => 'El estado de la referencia debe ser: Pendiente, Recibido, Cancelado o Despachado',
            'referencias.*.cantidad.min' => 'La cantidad debe ser al menos 1',
        ];
    }

    /**
     * Validación adicional para cancelación
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Si el estado es Cancelado, requiere motivo_cancelacion
            if ($this->input('estado') === 'Cancelado' && empty($this->input('motivo_cancelacion'))) {
                $validator->errors()->add('motivo_cancelacion', 'El motivo de cancelación es obligatorio cuando se cancela la orden');
            }
        });
    }
}
