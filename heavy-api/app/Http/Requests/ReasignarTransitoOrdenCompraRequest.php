<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\OrdenCompra;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para reasignar (prorrogar) el tiempo de entrega de una
 * Orden de Compra Demorada, devolviéndola a En Tránsito.
 */
class ReasignarTransitoOrdenCompraRequest extends FormRequest
{
    public function authorize(): bool
    {
        $ordenCompra = $this->route('orden_compra');

        return $ordenCompra instanceof OrdenCompra
            && $this->user() !== null
            && $this->user()->can('reasignarTransito', $ordenCompra);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'transito_prorrogado_hasta' => ['required', 'date', 'after:today'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'transito_prorrogado_hasta.required' => 'La nueva fecha de entrega es obligatoria.',
            'transito_prorrogado_hasta.after' => 'La nueva fecha de entrega debe ser posterior a hoy.',
        ];
    }
}
