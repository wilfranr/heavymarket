<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para crear un nuevo Pedido
 *
 * Valida los datos de entrada para la creación de pedidos
 * y define reglas de autorización.
 */
class StorePedidoRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Pedido::class)
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
            'tercero_id' => ['required', 'integer', 'exists:terceros,id'],
            'direccion' => ['nullable', 'string', 'max:200'],
            'comentario' => ['nullable', 'string', 'max:255'],
            'contacto_id' => ['nullable', 'integer', 'exists:contactos,id'],
            'estado' => [
                'required',
                Rule::in([
                    'Nuevo',
                    'Enviado',
                    'Entregado',
                    'Cancelado',
                    'Rechazado',
                    'Cotizado',
                    'En_Costeo',
                    'Aprobado',
                ]),
            ],
            'maquina_id' => ['nullable', 'integer', 'exists:maquinas,id'],
            'fabricante_id' => ['nullable', 'integer', 'exists:fabricantes,id'],

            // Arrays de referencias y artículos
            'referencias' => ['nullable', 'array'],
            'referencias.*.referencia_id' => ['required_with:referencias', 'integer', 'exists:referencias,id'],
            'referencias.*.sistema_id' => ['nullable', 'integer', 'exists:sistemas,id'],
            'referencias.*.marca_id' => ['nullable', 'integer', 'exists:listas,id'],
            'referencias.*.definicion' => ['nullable', 'string', 'max:255'],
            'referencias.*.cantidad' => ['required_with:referencias', 'integer', 'min:1'],
            'referencias.*.comentario' => ['nullable', 'string'],
            'referencias.*.imagen' => ['nullable', 'string', 'max:255'],
            'referencias.*.mostrar_referencia' => ['nullable', 'boolean'],
            'referencias.*.estado' => ['nullable', 'boolean'],

            'articulos' => ['nullable', 'array'],
            'articulos.*.articulo_id' => ['required_with:articulos', 'integer', 'exists:articulos,id'],
            'articulos.*.cantidad' => ['required_with:articulos', 'integer', 'min:1'],
            'articulos.*.comentario' => ['nullable', 'string'],
            'articulos.*.sistema_id' => ['nullable', 'integer', 'exists:sistemas,id'],
            'articulo.*.imagen' => ['nullable', 'string', 'max:255'],
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
            'tercero_id.required' => 'El tercero es obligatorio',
            'tercero_id.exists' => 'El tercero seleccionado no existe',
            'estado.required' => 'El estado es obligatorio',
            'estado.in' => 'El estado seleccionado no es válido',
            'maquina_id.exists' => 'La máquina seleccionada no existe',
            'fabricante_id.exists' => 'El fabricante seleccionado no existe',
        ];
    }

    /**
     * Prepara los datos para validación
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'user_id' => $this->user()->id,
        ]);
    }
}
