<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Carbon;

class AuditService
{
    public static function log(
        string $adminId,
        string $action,
        string $targetType,
        string $targetId,
        array $metadata = []
    ): void {
        AuditLog::create([
            'admin_id'     => $adminId,
            'action'       => $action,
            'target_type'  => $targetType,
            'target_id'    => $targetId,
            'metadata'     => $metadata,
            'performed_at' => Carbon::now(),
        ]);
    }
}