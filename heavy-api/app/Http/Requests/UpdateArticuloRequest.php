<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para actualizar un Artículo existente
 */
class UpdateArticuloRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['super_admin', 'Administrador']);
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'definicion' => ['sometimes', 'required', 'string', 'max:255'],
            'descripcionEspecifica' => ['sometimes', 'required', 'string', 'max:500'],
            'peso' => ['nullable', 'numeric', 'min:0'],
            'comentarios' => ['nullable', 'string'],
            'fotoDescriptiva' => ['nullable', 'string', 'max:255'],
            'foto_medida' => ['nullable', 'string', 'max:255'],
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
        ];
    }
}
