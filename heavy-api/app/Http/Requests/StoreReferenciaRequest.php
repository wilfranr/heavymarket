<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Referencia;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para crear una nueva Referencia
 */
class StoreReferenciaRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Referencia::class);
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'referencia' => ['required', 'string', 'max:255', 'unique:referencias,referencia'],
            'marca_id' => [
                'nullable',
                'integer',
                Rule::exists('listas', 'id')->whereIn('tipo', ['Marca', 'Fabricantes']),
            ],
            'articulo_id' => ['nullable', 'integer', 'exists:articulos,id'],
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
