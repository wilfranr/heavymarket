<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\OrdenCompraEstado;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para transiciones explícitas de Orden de Compra.
 */
class TransitionOrdenCompraRequest extends FormRequest
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
            'estado_destino' => ['required', 'string', Rule::in(OrdenCompraEstado::toArray())],
            'motivo_cancelacion' => [
                Rule::requiredIf(fn (): bool => $this->input('estado_destino') === OrdenCompraEstado::Cancelada->value),
                'nullable',
                'string',
                'max:2000',
            ],
            'notas_cierre' => ['nullable', 'string', 'max:2000'],
            'aprobacion_admin' => ['sometimes', 'boolean'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'estado_destino.required' => 'El estado destino es obligatorio',
            'estado_destino.in' => 'El estado destino no es válido',
            'motivo_cancelacion.required' => 'El motivo de cancelación es obligatorio',
        ];
    }
}
