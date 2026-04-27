<?php

namespace App\Http\Requests\Order;

use App\Http\Helpers\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
{
    return [
        'status' => ['required', 'in:confirmed,dispatched,delivered,completed'],
        'note'   => ['nullable', 'string', 'max:500'],
    ];
}

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            ApiResponse::error('Validation failed', 422, $validator->errors()->toArray())
        );
    }
}