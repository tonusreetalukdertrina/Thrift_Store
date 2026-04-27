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
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('product_id')->primary();
            $table->uuid('seller_id');
            $table->unsignedInteger('category_id');
            $table->string('title');
            $table->text('description');
            $table->decimal('price', 10, 2);
            $table->string('condition'); // New, Like New, Good, Fair
            $table->jsonb('images')->default('[]');
            $table->string('status')->default('draft'); // draft, active, sold, archived
            $table->string('location')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('seller_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('category_id')->references('category_id')->on('categories')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
