<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para crear una nueva Máquina
 */
class StoreMaquinaRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Vendedor']);
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tipo' => ['required', 'integer', 'exists:listas,id'],
            'modelo' => ['required', 'string', 'max:255'],
            'fabricante_id' => ['required', 'integer', 'exists:listas,id'],
            'serie' => ['nullable', 'string', 'max:255'],
            'arreglo' => ['nullable', 'string', 'max:255'],
            'foto' => ['nullable', 'file', 'image', 'max:10480'], // ~10MB
            'fotoId' => ['nullable', 'file', 'image', 'max:10480'], // ~10MB
            'tercero_id' => ['nullable', 'integer', 'exists:terceros,id'],
            // Solo la landing (LandingController) usa por_revisar; la app siempre revisado vía controlador
            'estado_revision' => ['prohibited'],
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
            'tipo.required' => 'El tipo de máquina es obligatorio',
            'tipo.exists' => 'El tipo de máquina seleccionado no existe',
            'modelo.required' => 'El modelo es obligatorio',
            'modelo.max' => 'El modelo no puede exceder 255 caracteres',
            'fabricante_id.required' => 'El fabricante es obligatorio',
            'fabricante_id.exists' => 'El fabricante seleccionado no existe',
            'serie.max' => 'La serie no puede exceder 255 caracteres',
            'arreglo.max' => 'El arreglo no puede exceder 255 caracteres',
            'foto.max' => 'La foto no puede exceder 10MB',
            'foto.image' => 'El archivo debe ser una imagen',
            'fotoId.max' => 'La foto ID no puede exceder 10MB',
            'fotoId.image' => 'El archivo fotoId debe ser una imagen',
        ];
    }
}
