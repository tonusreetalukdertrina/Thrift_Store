<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Listing extends Model
{
    protected $table = 'listings';
    protected $primaryKey = 'listing_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'listing_id',
        'seller_id',
        'interested_buyer_id',
        'category_id',
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

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id', 'user_id');
    }

    public function interestedBuyer()
    {
        return $this->belongsTo(User::class, 'interested_buyer_id', 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'category_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'listing_id', 'listing_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'listing_id', 'listing_id');
    }
}
