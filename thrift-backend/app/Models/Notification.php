<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $primaryKey = 'notification_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'notification_id',
        'user_id',
        'type',
        'channel',
        'subject',
        'body',
        'status',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];
}