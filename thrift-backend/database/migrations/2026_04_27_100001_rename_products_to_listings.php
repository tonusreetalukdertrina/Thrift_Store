<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('products', 'listings');
        Schema::table('listings', function (Blueprint $table) {
            $table->renameColumn('product_id', 'listing_id');
        });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->renameColumn('listing_id', 'product_id');
        });
        Schema::rename('listings', 'products');
    }
};
