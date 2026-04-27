<?php

namespace App\Http\Requests\Review;

use App\Http\Helpers\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_id' => ['required', 'uuid', 'exists:orders,order_id'],
            'rating'   => ['required', 'integer', 'min:1', 'max:5'],
            'comment'  => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            ApiResponse::error('Validation failed', 422, $validator->errors()->toArray())
        );
    }
}