<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $primaryKey = 'report_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'report_id',
        'reporter_id',
        'target_type',
        'target_id',
        'reason',
        'status',
        'admin_id',
        'admin_notes',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id', 'user_id');
    }
}