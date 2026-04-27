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
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('notification_id')->primary();
            $table->uuid('user_id');
            $table->string('type');
            $table->string('channel')->default('in_app'); // in_app, email
            $table->string('subject')->nullable();
            $table->text('body');
            $table->string('status')->default('unread'); // unread, read
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
