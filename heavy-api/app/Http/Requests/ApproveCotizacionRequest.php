<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApproveCotizacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $cotizacionId = $this->route('cotizacion')?->id;

        return [
            'referencia_ids' => ['sometimes', 'array', 'min:1'],
            'referencia_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('cotizacion_referencia_proveedores', 'id')
                    ->where(fn ($query) => $query->where('cotizacion_id', $cotizacionId)),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'referencia_ids.array' => 'Las referencias aprobadas deben enviarse como una lista.',
            'referencia_ids.min' => 'Debe aprobar al menos una referencia.',
            'referencia_ids.*.distinct' => 'No se pueden enviar referencias aprobadas duplicadas.',
            'referencia_ids.*.exists' => 'Una de las referencias seleccionadas no pertenece a la cotización.',
        ];
    }
}
