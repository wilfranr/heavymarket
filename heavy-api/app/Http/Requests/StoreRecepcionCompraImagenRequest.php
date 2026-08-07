<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\RecepcionCompraImagen;
use Illuminate\Foundation\Http\FormRequest;

class StoreRecepcionCompraImagenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'imagen' => ['required', 'file', 'mimes:jpeg,jpg,png,webp,pdf', 'max:5120'],
            'tipo' => ['required', 'string', 'in:'.RecepcionCompraImagen::TIPO_GUIA.','.RecepcionCompraImagen::TIPO_FOTO],
        ];
    }
}
