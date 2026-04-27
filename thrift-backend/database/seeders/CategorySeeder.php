<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        DB::table('categories')->insert([
            [
                'category_name' => 'Second-hand Clothes',
                'description' => 'Used and pre-loved clothing items',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_name' => 'Second-hand Books',
                'description' => 'Used books in various conditions',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_name' => 'Arts & Crafts',
                'description' => 'Handmade and recycled artisan goods',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
