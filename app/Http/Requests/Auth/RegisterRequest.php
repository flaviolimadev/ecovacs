<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20', 'unique:users,phone'],
            'password' => ['required', 'confirmed', Password::min(6)],
            'referral_code' => ['required', 'string', 'exists:users,referral_code'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome é obrigatório',
            'email.required' => 'O email é obrigatório',
            'email.email' => 'Digite um email válido',
            'email.unique' => 'Este email já está cadastrado',
            'phone.unique' => 'Este telefone já está cadastrado',
            'password.required' => 'A senha é obrigatória',
            'password.confirmed' => 'As senhas não coincidem',
            'password.min' => 'A senha deve ter no mínimo 6 caracteres',
            'referral_code.required' => 'O código de indicação é obrigatório',
            'referral_code.exists' => 'Código de indicação inválido',
        ];
    }
}
