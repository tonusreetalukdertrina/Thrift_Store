<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table      = 'audit_log'; // tell Laravel the exact table name
    public $timestamps    = false;
    protected $primaryKey = 'log_id';

    protected $fillable = [
        'admin_id',
        'action',
        'target_type',
        'target_id',
        'metadata',
        'performed_at',
    ];

    protected $casts = [
        'metadata'     => 'array',
        'performed_at' => 'datetime',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id', 'user_id');
    }
}