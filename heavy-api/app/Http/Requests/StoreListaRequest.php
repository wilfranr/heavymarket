<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para crear una nueva Lista
 */
class StoreListaRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista']);
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'tipo' => [
                'required',
                'string',
                Rule::in([
                    'Marca',
                    'Tipo de Máquina',
                    'Tipo de Artículo',
                    'Unidad de Medida',
                    'Tipo de Medida',
                    'Nombre de Medida',
                    'Categoría de Máquina',
                    'Piezas Estandar',
                ]),
            ],
            'nombre' => [
                'required',
                'string',
                'max:255',
                Rule::unique('listas', 'nombre')->where(fn ($q) => $q->where('tipo', $this->input('tipo'))),
            ],
            'definicion' => ['nullable', 'string'],
            'foto' => ['nullable', 'image', 'max:5120'],
            'fotoMedida' => ['nullable', 'image', 'max:5120'],
            'sistema_id' => ['nullable', 'integer', 'exists:sistemas,id'],
            'parent_id' => ['nullable', 'integer', 'exists:listas,id'],
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
            'tipo.required' => 'El tipo es obligatorio',
            'tipo.in' => 'El tipo seleccionado no es válido',
            'nombre.required' => 'El nombre es obligatorio',
            'nombre.unique' => 'Ya existe una lista con este nombre para este tipo',
            'sistema_id.exists' => 'El sistema seleccionado no existe',
        ];
    }
}
