<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para actualizar un Sistema existente
 */
class UpdateSistemaRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $sistemaId = $this->route('sistema');

        return [
            'nombre' => [
                'required',
                'string',
                'max:255',
                Rule::unique('sistemas', 'nombre')->ignore($sistemaId),
            ],
            'descripcion' => ['nullable', 'string'],
            'imagen' => ['nullable', 'image', 'max:2048'],
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
            'nombre.required' => 'El nombre del sistema es obligatorio',
            'nombre.unique' => 'Ya existe un sistema con este nombre',
            'nombre.max' => 'El nombre no puede exceder 255 caracteres',
            'imagen.max' => 'La ruta de la imagen no puede exceder 255 caracteres',
        ];
    }
}
