<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\OrdenCompraReferencia;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreRecepcionCompraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'orden_compra_id' => ['required', 'integer', 'exists:orden_compras,id'],
            'fecha_recepcion' => ['required', 'date'],
            'numero_remision' => ['nullable', 'string', 'max:100'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.orden_compra_detalle_id' => ['required', 'integer', 'exists:orden_compra_referencia,id'],
            'detalles.*.cantidad_recibida' => ['required', 'integer', 'min:1'],
            'detalles.*.cantidad_conforme' => ['required', 'integer', 'min:0'],
            'detalles.*.cantidad_rechazada' => ['required', 'integer', 'min:0'],
            'detalles.*.motivo_rechazo' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $this->validarCantidades($validator);
                $this->validarDetallesDeOrdenCompra($validator);
            },
        ];
    }

    protected function validarCantidades(Validator $validator): void
    {
        foreach ($this->input('detalles', []) as $index => $detalle) {
            $cantidadRecibida = (int) ($detalle['cantidad_recibida'] ?? 0);
            $cantidadConforme = (int) ($detalle['cantidad_conforme'] ?? 0);
            $cantidadRechazada = (int) ($detalle['cantidad_rechazada'] ?? 0);

            if ($cantidadRecibida !== $cantidadConforme + $cantidadRechazada) {
                $validator->errors()->add(
                    "detalles.{$index}.cantidad_recibida",
                    'La cantidad recibida debe ser igual a la suma de conforme y rechazada.'
                );
            }

            if ($cantidadRechazada > 0 && blank($detalle['motivo_rechazo'] ?? null)) {
                $validator->errors()->add(
                    "detalles.{$index}.motivo_rechazo",
                    'El motivo de rechazo es obligatorio cuando hay cantidad rechazada.'
                );
            }
        }
    }

    protected function validarDetallesDeOrdenCompra(Validator $validator): void
    {
        $ordenCompraId = (int) $this->input('orden_compra_id');
        $detalleIds = collect($this->input('detalles', []))
            ->pluck('orden_compra_detalle_id')
            ->filter()
            ->unique()
            ->values();

        if ($detalleIds->isEmpty()) {
            return;
        }

        $detallesValidos = OrdenCompraReferencia::query()
            ->where('orden_compra_id', $ordenCompraId)
            ->whereIn('id', $detalleIds)
            ->count();

        if ($detallesValidos !== $detalleIds->count()) {
            $validator->errors()->add(
                'detalles',
                'Todos los detalles recibidos deben pertenecer a la orden de compra indicada.'
            );
        }
    }
}
