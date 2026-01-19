<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para actualizar una Lista existente
 */
class UpdateListaRequest extends FormRequest
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
        $listaId = $this->route('lista') ?? $this->route('listas');

        return [
            'tipo' => [
                'sometimes',
                'string',
                Rule::in([
                    'Marca',
                    'Tipo de Máquina',
                    'Tipo de Artículo',
                    'Unidad de Medida',
                    'Tipo de Medida',
                    'Nombre de Medida',
                ])
            ],
            'nombre' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('listas', 'nombre')->ignore($listaId)
            ],
            'definicion' => ['nullable', 'string'],
            'foto' => ['nullable', 'string', 'max:255'],
            'fotoMedida' => ['nullable', 'string', 'max:255'],
            'sistema_id' => ['nullable', 'integer', 'exists:sistemas,id'],
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
            'tipo.in' => 'El tipo seleccionado no es válido',
            'nombre.unique' => 'Ya existe una lista con este nombre',
            'sistema_id.exists' => 'El sistema seleccionado no existe',
        ];
    }
}
