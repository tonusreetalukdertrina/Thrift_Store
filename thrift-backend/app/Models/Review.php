<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $primaryKey = 'review_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'review_id',
        'listing_id',
        'buyer_id',
        'seller_id',
        'rating',
        'comment',
        'seller_response',
        'seller_responded_at',
        'is_removed',
        'removed_by',
    ];

    protected $casts = [
        'is_removed'          => 'boolean',
        'seller_responded_at' => 'datetime',
        'rating'              => 'integer',
    ];

    public function listing()
    {
        return $this->belongsTo(Listing::class, 'listing_id', 'listing_id');
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id', 'user_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id', 'user_id');
    }
}
