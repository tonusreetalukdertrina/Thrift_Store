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
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('subcategory_id')->nullable()->after('category_id');
            $table->foreign('subcategory_id')
                ->references('subcategory_id')
                ->on('subcategories')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['subcategory_id']);
            $table->dropColumn('subcategory_id');
        });
    }
};
