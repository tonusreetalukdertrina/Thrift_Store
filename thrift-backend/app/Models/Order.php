<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $primaryKey = 'order_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'order_id',
        'buyer_id',
        'product_id',
        'status',
        'buyer_note',
        'cancelled_at',
        'cancel_reason',
    ];

    protected $casts = [
        'cancelled_at' => 'datetime',
    ];

    // Valid state machine transitions
    public const TRANSITIONS = [
        'pending'    => ['confirmed', 'cancelled'],
        'confirmed'  => ['dispatched', 'cancelled'],
        'dispatched' => ['completed'],
        'completed'  => [],
        'cancelled'  => [],
    ];

    public function canTransitionTo(string $newStatus): bool
    {
        return in_array($newStatus, self::TRANSITIONS[$this->status] ?? []);
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id', 'user_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function statusHistory()
    {
        return $this->hasMany(OrderStatusHistory::class, 'order_id', 'order_id')
                    ->orderBy('changed_at', 'asc');
    }

    public function review()
    {
        return $this->hasOne(Review::class, 'order_id', 'order_id');
    }
}