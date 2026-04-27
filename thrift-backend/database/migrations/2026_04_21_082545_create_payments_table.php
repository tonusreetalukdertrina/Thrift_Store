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
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('payment_id')->primary();
            $table->uuid('seller_id');
            $table->uuid('product_id');
            $table->decimal('amount', 10, 2);
            $table->char('currency', 3)->default('USD');
            $table->string('method')->nullable();
            $table->string('status')->default('pending'); // pending, paid, failed, refunded
            $table->string('transaction_ref')->nullable();
            $table->jsonb('gateway_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('seller_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
