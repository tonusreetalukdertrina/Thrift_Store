<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('order_status_history');
        Schema::dropIfExists('orders');
    }

    public function down(): void
    {
        // irreversible — data loss
    }
};
