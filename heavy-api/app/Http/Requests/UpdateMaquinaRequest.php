<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Maquina;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Form Request para actualizar una Máquina existente
 */
class UpdateMaquinaRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para hacer esta petición.
     */
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista']);
    }

    /**
     * Preparar los datos para la validación.
     */
    protected function prepareForValidation(): void
    {
        if ($this->input('codigo_interno') === '') {
            $this->merge(['codigo_interno' => null]);
        }

        // Convertir strings vacíos a null para campos opcionales
        if ($this->filled('componentes') && is_array($this->input('componentes'))) {
            $componentes = $this->input('componentes');
            foreach ($componentes as $index => $comp) {
                foreach (['sistema_id', 'marca_id', 'modelo', 'serie', 'comentario'] as $field) {
                    if (isset($comp[$field]) && $comp[$field] === '') {
                        $this->merge(["componentes.{$index}.{$field}" => null]);
                    }
                }
            }
        }
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $maquina = $this->route('maquina');
        $maquinaId = $maquina instanceof Maquina ? $maquina->id : $maquina;

        return [
            'tipo' => ['sometimes', 'required', 'integer', 'exists:listas,id'],
            'modelo' => ['sometimes', 'required', 'string', 'max:255'],
            'fabricante_id' => ['sometimes', 'required', 'integer', 'exists:listas,id'],
            'codigo_interno' => ['nullable', 'string', 'max:100', Rule::unique('maquinas', 'codigo_interno')->ignore($maquinaId)],
            'serie' => ['nullable', 'string', 'max:255'],
            'arreglo' => ['nullable', 'string', 'max:255'],
            'foto' => ['nullable', 'image', 'max:10480'],
            'fotoId' => ['nullable', 'image', 'max:10480'],
            'estado_revision' => ['sometimes', 'string', 'in:por_revisar,revisado'],
            'componentes' => ['nullable', 'array'],
            'componentes.*.id' => ['nullable', 'integer', 'exists:componentes_maquina,id'],
            'componentes.*.sistema_id' => ['nullable', 'integer', 'exists:listas,id'],
            'componentes.*.marca_id' => ['nullable', 'integer', 'exists:listas,id'],
            'componentes.*.modelo' => ['nullable', 'string', 'max:255'],
            'componentes.*.serie' => ['nullable', 'string', 'max:255'],
            'componentes.*.comentario' => ['nullable', 'string'],
            'componentes.*.foto_placa' => ['nullable', 'file', 'image', 'max:10480'],
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
            'codigo_interno.max' => 'El código interno no puede exceder 100 caracteres',
            'codigo_interno.unique' => 'El código interno ya está registrado en otra máquina',
            'serie.max' => 'La serie no puede exceder 255 caracteres',
            'arreglo.max' => 'El arreglo no puede exceder 255 caracteres',
            'foto.max' => 'La ruta de la foto no puede exceder 255 caracteres',
            'fotoId.max' => 'La ruta de la foto ID no puede exceder 255 caracteres',
        ];
    }
}
