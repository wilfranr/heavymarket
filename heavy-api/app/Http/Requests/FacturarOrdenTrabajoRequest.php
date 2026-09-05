<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\OrdenTrabajo;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para el cierre comercial de una Orden de Trabajo: registra
 * el numero de factura emitido en el software contable externo y,
 * opcionalmente, adjunta el PDF de la factura.
 */
class FacturarOrdenTrabajoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $ordenTrabajo = $this->route('orden_trabajo');

        return $ordenTrabajo instanceof OrdenTrabajo
            && $this->user() !== null
            && $this->user()->can('facturar', $ordenTrabajo);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'numero_factura' => ['required', 'string', 'max:255'],
            'factura_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'numero_factura.required' => 'El número de factura es obligatorio.',
            'factura_pdf.mimes' => 'El comprobante de factura debe ser un archivo PDF.',
        ];
    }
}
