<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\User::class);
    }

    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ];

        // Solo validamos contraseña si se envía, de lo contrario podría asumirse un default o error
        $rules['password'] = ['required', 'string', Password::min(8)];

        return $rules;
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->has('roles') && in_array('super_admin', $this->roles) && ! $this->user()->hasRole('super_admin')) {
                $validator->errors()->add('roles', 'No puedes asignar el rol super_admin si no eres uno.');
            }
        });
    }
}
