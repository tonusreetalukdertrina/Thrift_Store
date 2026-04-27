<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    // PostgreSQL needs explicit casting to change enum-like varchar constraints
    // Since status is varchar, no migration needed — just update the model
    // But we add delivered_at timestamp for tracking
    Schema::table('orders', function (Blueprint $table) {
        $table->timestamp('delivered_at')->nullable()->after('cancelled_at');
    });
}

public function down(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->dropColumn('delivered_at');
    });
}
};
