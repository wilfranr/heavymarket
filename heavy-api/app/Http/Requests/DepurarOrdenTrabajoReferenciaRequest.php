<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\OrdenTrabajo;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para depurar (marcar como faltante definitivo) una referencia
 * de una Orden de Trabajo.
 */
class DepurarOrdenTrabajoReferenciaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $ordenTrabajo = $this->route('orden_trabajo');

        return $ordenTrabajo instanceof OrdenTrabajo
            && $this->user() !== null
            && $this->user()->can('depurarReferencia', $ordenTrabajo);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'cantidad_depurada' => ['required', 'integer', 'min:1'],
            'motivo_depuracion' => ['required', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'cantidad_depurada.required' => 'La cantidad a depurar es obligatoria.',
            'cantidad_depurada.min' => 'La cantidad a depurar debe ser al menos 1.',
            'motivo_depuracion.required' => 'El motivo de la depuración es obligatorio.',
        ];
    }
}
