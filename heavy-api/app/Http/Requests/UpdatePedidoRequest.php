<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\PedidoEstado;
use App\Models\Pedido;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
        /** @var Pedido $pedido */
        $pedido = $this->route('pedido');

        return $this->user()->can('editComercial', $pedido);
    }

    /**
     * Indica si la petición intenta pasar el pedido a fase de costeo.
     */
    private function pasandoACosteo(): bool
    {
        return $this->input('estado') === 'En_Costeo';
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tercero_id' => ['sometimes', 'required', 'integer', 'exists:terceros,id'],
            'direccion' => ['nullable', 'string', 'max:200'],
            'comentario' => ['nullable'],
            'contacto_id' => ['nullable', 'integer', 'exists:contactos,id'],
            'estado' => [
                'sometimes',
                'required',
                Rule::in(PedidoEstado::toArray()),
            ],
            'maquina_id' => ['nullable', 'integer', 'exists:maquinas,id'],
            'fabricante_id' => ['nullable', 'integer', 'exists:listas,id'],
            'motivo_rechazo' => ['nullable', 'string', 'max:500'],
            'comentarios_rechazo' => ['nullable'],

            // Arrays de referencias (para sincronización)
            'referencias' => ['nullable', 'array'],
            'referencias.*.id' => ['nullable', 'integer', 'exists:pedido_referencia,id'], // ID de la relación si existe
            'referencias.*.referencia_id' => ['nullable', 'integer', 'exists:referencias,id'],
            'referencias.*.sistema_id' => ['nullable', 'integer', 'exists:sistemas,id'],
            'referencias.*.lista_id' => ['nullable', 'integer', 'exists:listas,id'],
            'referencias.*.categoria_comercial_id' => ['nullable', 'integer', 'exists:listas,id'],
            'referencias.*.categoria_comercial_ids' => ['nullable', 'array'],
            'referencias.*.categoria_comercial_ids.*' => ['integer', 'exists:listas,id'],
            'referencias.*.marca_id' => ['nullable', 'integer', 'exists:listas,id'],
            // Borrador de análisis: referencia y definición opcionales al guardar.
            // La exigencia de referencia por línea solo aplica al pasar a En_Costeo (withValidator).
            'referencias.*.definicion' => ['nullable', 'string', 'max:255'],
            'referencias.*.cantidad' => ['nullable', 'integer', 'min:1'],
            'referencias.*.comentario' => ['nullable', 'string'],
            'referencias.*.imagen' => ['nullable', 'string', 'max:255'],
            'referencias.*.mostrar_referencia' => ['nullable', 'string'],
            // El front envía 1/0 (int); antes era solo string y provocaba 422.
            'referencias.*.estado' => ['nullable', 'boolean'],
            'referencias.*.imagenes_nuevas' => ['nullable', 'array'],
            'referencias.*.imagenes_nuevas.*' => ['file', 'image', 'max:10240'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (! $this->pasandoACosteo()) {
                return;
            }

            if (! $this->user()->hasAnyRole(['Analista', 'Administrador', 'super_admin'])) {
                $v->errors()->add(
                    'estado',
                    'Solo analistas o administración pueden pasar el pedido a costeo.'
                );

                return;
            }

            $referenciasInput = $this->input('referencias');

            if (is_array($referenciasInput) && $referenciasInput !== []) {
                foreach ($referenciasInput as $i => $row) {
                    if (! is_array($row)) {
                        continue;
                    }
                    if (empty($row['referencia_id'])) {
                        $v->errors()->add(
                            'referencias.'.$i.'.referencia_id',
                            'Cada línea debe tener una referencia del catálogo antes de pasar a costeo.'
                        );
                    }
                    $cant = $row['cantidad'] ?? null;
                    if ($cant === null || $cant === '' || (int) $cant < 1) {
                        $v->errors()->add(
                            'referencias.'.$i.'.cantidad',
                            'Cada línea debe tener cantidad mayor o igual a 1 antes de pasar a costeo.'
                        );
                    }
                }

                return;
            }

            /** @var Pedido $pedido */
            $pedido = $this->route('pedido');

            if ($pedido->referencias()->count() === 0) {
                $v->errors()->add(
                    'estado',
                    'No puede pasar a costeo sin líneas de análisis/referencias en el pedido.'
                );

                return;
            }

            if ($pedido->referencias()->whereNull('referencia_id')->exists()) {
                $v->errors()->add(
                    'estado',
                    'No puede pasar a costeo: hay líneas sin referencia asignada. Guarde el análisis con todas las referencias o complételas antes de finalizar.'
                );
            }

            if ($pedido->referencias()->where(function ($q): void {
                $q->whereNull('cantidad')->orWhere('cantidad', '<', 1);
            })->exists()) {
                $v->errors()->add(
                    'estado',
                    'No puede pasar a costeo: hay líneas con cantidad inválida.'
                );
            }
        });
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
