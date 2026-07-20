<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\OrdenCompraEstado;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para actualizar una Orden de Compra existente
 */
class UpdateOrdenCompraRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('orden_compra'))
            || $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Logistica']);
    }

    /**
     * Reglas de validación que aplican a la petición.
     */
    public function rules(): array
    {
        return [
            'estado' => [
                'sometimes',
                Rule::in(OrdenCompraEstado::toArray()),
            ],
            'color' => [
                'sometimes',
                Rule::in(array_map(
                    static fn (OrdenCompraEstado $estado): string => $estado->color(),
                    OrdenCompraEstado::todos()
                )),
            ],
            'fecha_expedicion' => ['sometimes', 'date'],
            'fecha_entrega' => ['sometimes', 'date', 'after_or_equal:fecha_expedicion'],
            'fecha_envio' => ['nullable', 'date'],
            'fecha_confirmacion' => ['nullable', 'date'],
            'fecha_recepcion' => ['nullable', 'date'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
            'motivo_cancelacion' => ['nullable', 'string', 'max:2000'],
            'notas_cierre' => ['nullable', 'string', 'max:2000'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'guia' => ['nullable', 'string', 'max:100'],
            'referencias' => ['nullable', 'array'],
            'referencias.*.referencia_id' => ['required_with:referencias', 'integer', 'exists:referencias,id'],
            'referencias.*.cantidad' => ['required_with:referencias', 'integer', 'min:1'],
            'referencias.*.valor_unitario' => ['required_with:referencias', 'numeric', 'min:0'],
            'referencias.*.valor_total' => ['required_with:referencias', 'numeric', 'min:0'],
        ];
    }

    /**
     * Mensajes de error personalizados
     */
    public function messages(): array
    {
        return [
            'fecha_entrega.after_or_equal' => 'La fecha de entrega debe ser posterior o igual a la fecha de expedición',
            'estado.in' => 'El estado seleccionado no es válido',
            'color.in' => 'El color seleccionado no es válido',
        ];
    }
}
