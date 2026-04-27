<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Helpers\ApiResponse;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    // POST /api/v1/reports — any user can report
    public function store(Request $request)
    {
        $request->validate([
            'target_type' => ['required', 'in:listing,review,user'],
            'target_id'   => ['required', 'uuid'],
            'reason'      => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        $userId = auth('api')->user()->user_id;

        // Prevent duplicate reports
        $exists = Report::where('reporter_id', $userId)
            ->where('target_type', $request->target_type)
            ->where('target_id', $request->target_id)
            ->where('status', 'pending')
            ->exists();

        if ($exists) {
            return ApiResponse::error('You have already reported this item', 422);
        }

        $report = Report::create([
            'report_id'   => Str::uuid(),
            'reporter_id' => $userId,
            'target_type' => $request->target_type,
            'target_id'   => $request->target_id,
            'reason'      => $request->reason,
            'status'      => 'pending',
        ]);

        return ApiResponse::created($report, 'Report submitted. Our team will review within 72 hours.');
    }
}