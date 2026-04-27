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
        Schema::create('order_status_history', function (Blueprint $table) {
            $table->increments('history_id');
            $table->uuid('order_id');
            $table->uuid('changed_by');
            $table->string('old_status');
            $table->string('new_status');
            $table->text('note')->nullable();
            $table->timestamp('changed_at')->useCurrent();

            $table->foreign('order_id')->references('order_id')->on('orders')->onDelete('cascade');
            $table->foreign('changed_by')->references('user_id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_status_history');
    }
};
