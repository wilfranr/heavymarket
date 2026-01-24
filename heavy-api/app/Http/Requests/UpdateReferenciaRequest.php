<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para actualizar una Referencia existente
 */
class UpdateReferenciaRequest extends FormRequest
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
        $referenciaId = $this->route('referencia');

        return [
            'referencia' => [
                'required',
                'string',
                'max:255',
                Rule::unique('referencias', 'referencia')->ignore($referenciaId),
            ],
            'marca_id' => ['nullable', 'integer', 'exists:listas,id'],
            'comentario' => ['nullable', 'string', 'max:500'],
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
            'referencia.required' => 'La referencia es obligatoria',
            'referencia.unique' => 'Ya existe una referencia con este código',
            'referencia.max' => 'La referencia no puede exceder 255 caracteres',
            'marca_id.exists' => 'La marca seleccionada no existe',
            'comentario.max' => 'El comentario no puede exceder 500 caracteres',
        ];
    }
}
