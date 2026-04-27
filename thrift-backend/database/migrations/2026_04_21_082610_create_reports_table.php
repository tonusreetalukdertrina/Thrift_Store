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
        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('report_id')->primary();
            $table->uuid('reporter_id');
            $table->string('target_type'); // listing, review, user
            $table->uuid('target_id');
            $table->text('reason');
            $table->string('status')->default('pending'); // pending, resolved, dismissed
            $table->uuid('admin_id')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('reporter_id')->references('user_id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
