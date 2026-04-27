<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $primaryKey = 'product_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'product_id',
        'seller_id',
        'category_id',
        'subcategory_id',
        'title',
        'description',
        'price',
        'condition',
        'images',
        'status',
        'location',
        'expires_at',
    ];

    protected $casts = [
        'images'     => 'array',
        'price'      => 'decimal:2',
        'expires_at' => 'datetime',
    ];

    public function subcategory()
    {
        return $this->belongsTo(Subcategory::class, 'subcategory_id', 'subcategory_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id', 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'category_id');
    }

    public function reviews()
    {
        return $this->hasManyThrough(
            Review::class,
            Order::class,
            'product_id',
            'order_id',
            'product_id',
            'order_id'
        );
    }
}