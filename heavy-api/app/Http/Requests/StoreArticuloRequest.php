<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para crear un nuevo Artículo
 */
class StoreArticuloRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Analista']);
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'definicion' => ['required', 'string', 'max:255'],
            'descripcionEspecifica' => ['required', 'string', 'max:500'],
            'peso' => ['nullable', 'numeric', 'min:0'],
            'comentarios' => ['nullable', 'string'],
            'fotoDescriptiva' => ['nullable', 'file', 'image', 'max:5120'],
            'foto_medida' => ['nullable', 'file', 'image', 'max:5120'],
            'referencias_ids' => ['required', 'array', 'min:1'],
            'referencias_ids.*' => ['required', 'exists:referencias,id'],
            'medidas' => ['nullable', 'string'],
            'juegos' => ['nullable', 'string'],
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
            'definicion.required' => 'La definición es obligatoria',
            'definicion.max' => 'La definición no puede exceder 255 caracteres',
            'descripcionEspecifica.required' => 'La descripción específica es obligatoria',
            'descripcionEspecifica.max' => 'La descripción específica no puede exceder 500 caracteres',
            'peso.numeric' => 'El peso debe ser un número',
            'peso.min' => 'El peso no puede ser negativo',
            'fotoDescriptiva.max' => 'La ruta de la foto descriptiva no puede exceder 255 caracteres',
            'foto_medida.max' => 'La ruta de la foto de medida no puede exceder 255 caracteres',
            'referencias_ids.required' => 'Debe asociar al menos una referencia al artículo',
            'referencias_ids.min' => 'Debe asociar al menos una referencia al artículo',
        ];
    }
}
