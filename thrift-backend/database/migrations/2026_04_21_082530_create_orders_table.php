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
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('order_id')->primary();
            $table->uuid('buyer_id');
            $table->uuid('product_id');
            $table->string('status')->default('pending'); // pending, confirmed, dispatched, completed, cancelled
            $table->text('buyer_note')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancel_reason')->nullable();
            $table->timestamps();

            $table->foreign('buyer_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
