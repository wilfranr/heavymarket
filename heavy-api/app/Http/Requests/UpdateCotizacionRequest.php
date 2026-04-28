<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para actualizar una Cotización
 *
 * Valida los datos de entrada para la actualización de cotizaciones.
 */
class UpdateCotizacionRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'estado' => ['sometimes', 'string', 'in:Pendiente,Enviada,Aprobada,Rechazada,Vencida,En_Proceso'],
            'observaciones' => ['nullable', 'string', 'max:1000'],
            'fecha_vencimiento' => ['sometimes', 'date'],
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
            'estado.in' => 'El estado seleccionado no es válido',
            'fecha_vencimiento.after' => 'La fecha de vencimiento debe ser posterior a hoy',
            'observaciones.max' => 'Las observaciones no pueden exceder los 1000 caracteres',
        ];
    }
}
