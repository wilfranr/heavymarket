<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para actualizar un Pedido existente
 */
class UpdatePedidoRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        $pedido = $this->route('pedido');
        
        return $this->user()->can('update', $pedido)
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
            'tercero_id' => ['sometimes', 'required', 'integer', 'exists:terceros,id'],
            'direccion' => ['nullable', 'string', 'max:200'],
            'comentario' => ['nullable', 'string', 'max:255'],
            'contacto_id' => ['nullable', 'integer', 'exists:contactos,id'],
            'estado' => [
                'sometimes',
                'required',
                Rule::in([
                    'Nuevo',
                    'Enviado',
                    'Entregado',
                    'Cancelado',
                    'Rechazado',
                    'Cotizado',
                    'En_Costeo',
                    'Aprobado'
                ])
            ],
            'maquina_id' => ['nullable', 'integer', 'exists:maquinas,id'],
            'fabricante_id' => ['nullable', 'integer', 'exists:fabricantes,id'],
            'motivo_rechazo' => ['nullable', 'string', 'max:255'],
            'comentarios_rechazo' => ['nullable', 'string', 'max:255'],
            
            // Arrays de referencias (para sincronización)
            'referencias' => ['nullable', 'array'],
            'referencias.*.id' => ['nullable', 'integer', 'exists:pedido_referencias,id'], // ID de la relación si existe
            'referencias.*.referencia_id' => ['nullable', 'integer', 'exists:referencias,id'],
            'referencias.*.sistema_id' => ['nullable', 'integer', 'exists:sistemas,id'],
            'referencias.*.marca_id' => ['nullable', 'integer', 'exists:fabricantes,id'], // Nota: En Store usa fabricantes,id
            'referencias.*.definicion' => ['required_without:referencias.*.referencia_id', 'nullable', 'string', 'max:255'],
            'referencias.*.cantidad' => ['required_with:referencias', 'integer', 'min:1'],
            'referencias.*.comentario' => ['nullable', 'string'],
            'referencias.*.imagen' => ['nullable', 'string', 'max:255'],
            'referencias.*.mostrar_referencia' => ['nullable', 'boolean'],
            'referencias.*.estado' => ['nullable', 'boolean'],
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
            'tercero_id.exists' => 'El tercero seleccionado no existe',
            'estado.in' => 'El estado seleccionado no es válido',
            'maquina_id.exists' => 'La máquina seleccionada no existe',
            'fabricante_id.exists' => 'El fabricante seleccionado no existe',
        ];
    }
}
