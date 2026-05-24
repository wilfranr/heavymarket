<?php

namespace App\Http\Requests;

use App\Models\PedidoReferencia;
use App\Models\Tercero;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProviderCosteoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasRole('Proveedor');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $tercero = Tercero::where('user_id', $user->id)->first();

        return [
            'pedido_referencia_id' => [
                'required',
                'integer',
                'exists:pedido_referencia,id',
                function ($attribute, $value, $fail) use ($tercero) {
                    $ref = PedidoReferencia::find($value);
                    if (! $ref) {
                        return;
                    }

                    // 1. Validar que el pedido esté en fase de costeo
                    if ($ref->pedido->estado !== 'En_Costeo') {
                        $fail('Esta referencia no se encuentra en fase de costeo activa.');
                    }

                    // 2. Validar que no haya enviado costeo previamente (Inmutabilidad)
                    $exists = $ref->proveedores()->where('proveedor_id', $tercero->id)->exists();
                    if ($exists) {
                        $fail('Ya has enviado una oferta para esta referencia.');
                    }

                    // 3. Validar matching de especialidad (Opcional pero recomendado para seguridad extra)
                    $misMarcas = $tercero->fabricantes()->pluck('lista_id')->toArray();
                    $misCategorias = $tercero->categoriasComerciales()->pluck('lista_id')->toArray();

                    if (! in_array($ref->marca_id, $misMarcas) && ! in_array($ref->categoria_comercial_id, $misCategorias)) {
                        $fail('Esta referencia no coincide con su especialidad registrada.');
                    }
                },
            ],
            'costo_unidad' => ['required', 'numeric', 'min:0'],
            'dias_entrega' => ['required', 'integer', 'min:0'],
            'marca_id' => ['nullable', 'integer', 'exists:listas,id'],
            'comentario' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'pedido_referencia_id.required' => 'Debe especificar la referencia a costear.',
            'costo_unidad.required' => 'El precio de costo es obligatorio.',
            'dias_entrega.required' => 'El tiempo de entrega es obligatorio.',
            'pedido_referencia_id.exists' => 'La referencia seleccionada no es válida.',
        ];
    }
}
