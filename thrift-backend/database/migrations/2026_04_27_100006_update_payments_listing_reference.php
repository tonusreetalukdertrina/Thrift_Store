<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->renameColumn('product_id', 'listing_id');
            $table->foreign('listing_id')->references('listing_id')->on('listings')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['listing_id']);
            $table->renameColumn('listing_id', 'product_id');
            $table->foreign('product_id')->references('product_id')->on('listings')->cascadeOnDelete();
        });
    }
};
