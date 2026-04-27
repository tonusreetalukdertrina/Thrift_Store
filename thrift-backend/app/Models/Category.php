<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $primaryKey = 'category_id';
    public $incrementing = true;

    protected $fillable = [
        'category_name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function products()
    {
        return $this->hasMany(Product::class, 'category_id', 'category_id');
    }

    public function subcategories()
    {
        return $this->hasMany(Subcategory::class, 'category_id', 'category_id')
                    ->where('is_active', true);
    }
}