<?php

namespace App\Http\Requests\Product;

use App\Http\Helpers\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['sometimes', 'string', 'min:5', 'max:120'],
            'description' => ['sometimes', 'string', 'min:20', 'max:2000'],
            'price'       => ['sometimes', 'numeric', 'min:0.01'],
            'condition'   => ['sometimes', 'in:New,Like New,Good,Fair'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,category_id'],
            'location'    => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            ApiResponse::error('Validation failed', 422, $validator->errors()->toArray())
        );
    }
}