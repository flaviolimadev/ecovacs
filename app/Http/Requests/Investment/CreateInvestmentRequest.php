<?php

namespace App\Http\Requests\Investment;

use Illuminate\Foundation\Http\FormRequest;

class CreateInvestmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'plan_id.required' => 'O plano é obrigatório',
            'plan_id.exists' => 'Plano não encontrado',
        ];
    }
}
