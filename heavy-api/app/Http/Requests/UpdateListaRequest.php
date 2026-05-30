<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Lista;
use Illuminate\Contracts\Validation\ValidationRule;
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
        return $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista']);
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('sistema_ids') || $this->has('sistema_ids_cleared')) {
            $this->merge([
                'sistema_ids' => $this->normalizeSistemaIdsInput(),
            ]);
        }
    }

    /**
     * @return list<int>
     */
    private function normalizeSistemaIdsInput(): array
    {
        if ($this->has('sistema_ids_cleared')) {
            return [];
        }

        $raw = $this->input('sistema_ids');

        if (is_string($raw)) {
            $decoded = json_decode($raw, true);

            return is_array($decoded) ? array_map('intval', $decoded) : [];
        }

        if (! is_array($raw)) {
            return [];
        }

        return array_map('intval', $raw);
    }

    /**
     * Reglas de validación que aplican a la petición.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Lista|null $lista */
        $lista = $this->route('lista');

        // Fallback en caso de que el binding no sea un objeto
        if (! $lista instanceof Lista) {
            $lista = Lista::find($lista);
        }

        if (! $lista) {
            return []; // O manejar error de no encontrado
        }

        $listaId = $lista->id;
        $tipoForUnique = $this->input('tipo', $lista->tipo);

        $nombreRules = [
            'sometimes',
            'string',
            'max:255',
        ];

        // Solo validamos unicidad si el nombre o el tipo están cambiando.
        // Esto permite actualizar otros campos (foto, definicion) de listas duplicadas heredadas.
        $nombreInput = $this->input('nombre', $lista->nombre);
        $tipoInput = $this->input('tipo', $lista->tipo);

        if (strcasecmp($nombreInput, $lista->nombre) !== 0 || $tipoInput !== $lista->tipo) {
            $nombreRules[] = Rule::unique('listas', 'nombre')
                ->ignore($listaId)
                ->where(fn ($q) => $q->where('tipo', $tipoForUnique));
        }

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
                    'Categoría Comercial',
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
            'nombre' => $nombreRules,
            'definicion' => ['nullable', 'string'],
            'foto' => ['nullable', 'image', 'max:5120'],
            'fotoMedida' => ['nullable', 'image', 'max:5120'],
            'sistema_id' => ['nullable', 'integer', 'exists:sistemas,id'],
            'sistema_ids' => ['nullable', 'array'],
            'sistema_ids.*' => ['integer', 'exists:sistemas,id'],
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
