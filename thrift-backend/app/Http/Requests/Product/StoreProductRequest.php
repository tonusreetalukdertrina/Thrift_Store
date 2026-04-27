<?php

namespace App\Http\Requests\Product;

use App\Http\Helpers\ApiResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'min:5', 'max:120'],
            'description' => ['required', 'string', 'min:20', 'max:2000'],
            'price'       => ['required', 'numeric', 'min:0.01'],
            'condition'   => ['required', 'in:New,Like New,Good,Fair'],
            'category_id' => ['required', 'integer', 'exists:categories,category_id'],
            'location'    => ['nullable', 'string', 'max:255'],
            'images'      => ['required', 'array', 'min:3', 'max:5'],
            'images.*'    => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'subcategory_id' => ['nullable', 'integer', 'exists:subcategories,subcategory_id'],
        ];
    }

    public function messages(): array
    {
        return [
            'images.min'   => 'You must upload at least 3 images.',
            'images.max'   => 'You can upload a maximum of 5 images.',
            'images.*.image' => 'Each file must be an image.',
            'images.*.mimes' => 'Images must be JPEG, PNG, or WebP.',
            'images.*.max'   => 'Each image must be under 5MB.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            ApiResponse::error('Validation failed', 422, $validator->errors()->toArray())
        );
    }
}