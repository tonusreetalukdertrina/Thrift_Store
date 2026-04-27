<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn('subcategory_id');
            $table->uuid('interested_buyer_id')->nullable()->after('seller_id');
            $table->foreign('interested_buyer_id')->references('user_id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropForeign(['interested_buyer_id']);
            $table->dropColumn('interested_buyer_id');
            $table->integer('subcategory_id')->nullable()->after('category_id');
        });
    }
};
