<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $primaryKey = 'payment_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'payment_id',
        'seller_id',
        'product_id',
        'amount',
        'currency',
        'method',
        'status',
        'transaction_ref',
        'gateway_response',
        'paid_at',
    ];

    protected $casts = [
        'gateway_response' => 'array',
        'paid_at'          => 'datetime',
        'amount'           => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id', 'user_id');
    }
}