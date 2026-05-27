<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SolicitarFletePaisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'flete' => ['required', 'numeric', 'min:0', 'max:100'],
            'proveedor_id' => ['required', 'integer', 'exists:terceros,id'],
            'pedido_id' => ['required', 'integer', 'exists:pedidos,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'flete.required' => 'Indique la tarifa de flete sugerida (USD/lb).',
            'flete.min' => 'La tarifa no puede ser negativa.',
            'flete.max' => 'La tarifa no puede exceder 100 USD/lb.',
        ];
    }
}
