<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Lista;
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
        return $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Analista']);
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Lista $lista */
        $lista = $this->route('lista');
        $listaId = $lista->id;
        $tipoForUnique = $this->input('tipo', $lista->tipo);

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
                    'Categoría de Máquina',
                    'Piezas Estandar',
                    'Fabricantes',
                ]),
                function ($attribute, $value, $fail) use ($lista) {
                    if ($value === 'Fabricantes' && ! $lista->esCatalogoFabricantes()) {
                        $fail('No puede asignar manualmente el tipo Fabricantes.');
                    }
                    if ($lista->esCatalogoFabricantes() && $value !== null && $value !== 'Fabricantes') {
                        $fail('No puede cambiar el tipo de un ítem de catálogo Fabricantes.');
                    }
                },
            ],
            'nombre' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('listas', 'nombre')->ignore($listaId)->where(fn ($q) => $q->where('tipo', $tipoForUnique)),
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
            'tipo.in' => 'El tipo seleccionado no es válido',
            'nombre.unique' => 'Ya existe una lista con este nombre para este tipo',
            'sistema_id.exists' => 'El sistema seleccionado no existe',
        ];
    }
}
