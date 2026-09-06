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
            'instrucciones_despacho' => [
                Rule::requiredIf(fn (): bool => $this->input('estado_destino') === OrdenCompraEstado::PendienteRevisionStock->value),
                'nullable',
                'string',
                'max:2000',
            ],
            'motivo_cancelacion' => [
                Rule::requiredIf(fn (): bool => $this->input('estado_destino') === OrdenCompraEstado::Cancelada->value),
                'nullable',
                'string',
                'max:2000',
            ],
            'motivo_reembolso' => [
                Rule::requiredIf(fn (): bool => $this->input('estado_destino') === OrdenCompraEstado::CanceladaReembolsoPendiente->value),
                'nullable',
                'string',
                'max:2000',
            ],
            'motivo_rechazo_gerencia' => [
                Rule::requiredIf(fn (): bool => $this->input('estado_destino') === OrdenCompraEstado::DevueltaPorGerencia->value),
                'nullable',
                'string',
                'max:2000',
            ],
            'referencia_pago' => ['nullable', 'string', 'max:100'],
            'comprobante_pago_ruta' => [
                Rule::requiredIf(fn (): bool => $this->input('estado_destino') === OrdenCompraEstado::PagadaListaDespacho->value && $this->route('orden_compra')?->estado !== OrdenCompraEstado::RecepcionConNovedades->value),
                'nullable',
                'string',
                'max:255',
            ],
            'resolucion_novedad_tipo' => [
                Rule::requiredIf(fn (): bool => $this->route('orden_compra')?->estado === OrdenCompraEstado::RecepcionConNovedades->value && in_array($this->input('estado_destino'), [OrdenCompraEstado::PagadaListaDespacho->value, OrdenCompraEstado::EntregadaCerrada->value], true)),
                'nullable',
                'string',
                Rule::in(['reposicion', 'nota_credito']),
            ],
            'resolucion_novedad_comentario' => [
                Rule::requiredIf(fn (): bool => $this->route('orden_compra')?->estado === OrdenCompraEstado::RecepcionConNovedades->value && in_array($this->input('estado_destino'), [OrdenCompraEstado::PagadaListaDespacho->value, OrdenCompraEstado::EntregadaCerrada->value], true)),
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
            'comprobante_pago_ruta.required' => 'El comprobante de pago es obligatorio',
        ];
    }
}
