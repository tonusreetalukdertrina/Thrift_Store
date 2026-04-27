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
        Schema::create('reviews', function (Blueprint $table) {
            $table->uuid('review_id')->primary();
            $table->uuid('order_id');
            $table->uuid('buyer_id');
            $table->uuid('seller_id');
            $table->smallInteger('rating');
            $table->text('comment')->nullable();
            $table->text('seller_response')->nullable();
            $table->timestamp('seller_responded_at')->nullable();
            $table->boolean('is_removed')->default(false);
            $table->uuid('removed_by')->nullable();
            $table->timestamps();

            $table->foreign('order_id')->references('order_id')->on('orders')->onDelete('cascade');
            $table->foreign('buyer_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('seller_id')->references('user_id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
