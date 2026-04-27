<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SubcategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subs = [
            // Second-hand Clothes (category_id = 1)
            1 => ['Men\'s Clothing', 'Women\'s Clothing', 'Kids\' Clothing', 'Shoes', 'Bags & Accessories', 'Traditional Wear'],
            // Second-hand Books (category_id = 2)
            2 => ['Textbooks', 'Fiction', 'Non-Fiction', 'Children\'s Books', 'Comics & Manga', 'Religious Books'],
            // Arts & Crafts (category_id = 3)
            3 => ['Paintings', 'Handmade Jewellery', 'Pottery & Ceramics', 'Sculptures', 'Handmade Clothing', 'Digital Art Prints'],
        ];

        foreach ($subs as $categoryId => $names) {
            foreach ($names as $name) {
                \App\Models\Subcategory::create([
                    'category_id'      => $categoryId,
                    'subcategory_name' => $name,
                    'is_active'        => true,
                ]);
            }
        }
    }
}
