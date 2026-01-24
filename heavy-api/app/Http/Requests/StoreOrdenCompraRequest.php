<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para crear una nueva Orden de Compra
 *
 * Valida los datos de entrada para la creación de órdenes de compra
 * y define reglas de autorización.
 */
class StoreOrdenCompraRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\OrdenCompra::class)
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
            'proveedor_id' => ['required', 'integer', 'exists:terceros,id'],
            'pedido_id' => ['nullable', 'integer', 'exists:pedidos,id'],
            'cotizacion_id' => ['nullable', 'integer', 'exists:cotizaciones,id'],
            'tercero_id' => ['nullable', 'integer', 'exists:terceros,id'],
            'fecha_expedicion' => ['required', 'date'],
            'fecha_entrega' => ['required', 'date', 'after_or_equal:fecha_expedicion'],
            'estado' => [
                'nullable',
                Rule::in(['Pendiente', 'En proceso', 'Entregado', 'Cancelado']),
            ],
            'color' => [
                'nullable',
                Rule::in(['#FFFF00', '#00ff00', '#ff0000']), // Amarillo, Verde, Rojo
            ],
            'observaciones' => ['nullable', 'string', 'max:1000'],
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
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'proveedor_id.required' => 'El proveedor es obligatorio',
            'proveedor_id.exists' => 'El proveedor seleccionado no existe',
            'fecha_expedicion.required' => 'La fecha de expedición es obligatoria',
            'fecha_entrega.required' => 'La fecha de entrega es obligatoria',
            'fecha_entrega.after_or_equal' => 'La fecha de entrega debe ser posterior o igual a la fecha de expedición',
            'estado.in' => 'El estado seleccionado no es válido',
            'color.in' => 'El color seleccionado no es válido',
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
            'color' => $this->input('color', '#FFFF00'), // Amarillo por defecto (En proceso)
        ]);
    }
}
