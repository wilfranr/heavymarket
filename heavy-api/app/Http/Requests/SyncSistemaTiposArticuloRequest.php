<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request para sincronizar tipos de artículo de un sistema.
 */
class SyncSistemaTiposArticuloRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['super_admin', 'Administrador', 'Vendedor', 'Analista']);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'lista_ids' => ['present', 'array'],
            'lista_ids.*' => ['integer', 'exists:listas,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'lista_ids.present' => 'Debe enviar la lista de tipos de artículo (puede ser vacía)',
            'lista_ids.*.exists' => 'Uno de los tipos de artículo seleccionados no existe',
        ];
    }
}
