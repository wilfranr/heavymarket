<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\CotizacionReferenciaProveedor;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
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
            'cantidades' => ['sometimes', 'array'],
            'cantidades.*' => ['integer', 'min:1'],
            'direccion_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('direcciones', 'id')
                    ->where(fn ($query) => $query->where('tercero_id', $this->route('cotizacion')?->tercero_id)),
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
            'cantidades.*.integer' => 'La cantidad aprobada debe ser un número entero.',
            'cantidades.*.min' => 'La cantidad aprobada debe ser al menos 1.',
            'direccion_id.exists' => 'El perfil de despacho seleccionado no pertenece al cliente de la cotización.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $cantidades = $this->input('cantidades', []);

            if (! is_array($cantidades) || $cantidades === []) {
                return;
            }

            $referenciaIds = array_map('intval', array_keys($cantidades));

            $snapshots = CotizacionReferenciaProveedor::query()
                ->where('cotizacion_id', $this->route('cotizacion')?->id)
                ->whereIn('id', $referenciaIds)
                ->pluck('snapshot_cantidad', 'id');

            foreach ($cantidades as $referenciaId => $cantidad) {
                $cantidadOriginal = $snapshots->get((int) $referenciaId);

                if ($cantidadOriginal === null) {
                    $validator->errors()->add(
                        "cantidades.{$referenciaId}",
                        'Una de las referencias con cantidad editada no pertenece a la cotización.'
                    );

                    continue;
                }

                if ((int) $cantidad > (int) $cantidadOriginal) {
                    $validator->errors()->add(
                        "cantidades.{$referenciaId}",
                        "La cantidad aprobada no puede superar la cantidad cotizada ({$cantidadOriginal})."
                    );
                }
            }
        });
    }
}
