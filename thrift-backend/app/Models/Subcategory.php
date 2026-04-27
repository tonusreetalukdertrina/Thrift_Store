<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subcategory extends Model
{
    protected $primaryKey = 'subcategory_id';
    public $incrementing  = true;

    protected $fillable = [
        'category_id',
        'subcategory_name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'category_id');
    }
}