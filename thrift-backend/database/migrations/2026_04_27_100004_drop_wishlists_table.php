<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('wishlists');
    }

    public function down(): void
    {
        // irreversible — data loss
    }
};
