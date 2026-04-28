<?php

namespace Database\Seeders;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ListingSeeder extends Seeder
{
    public function run(): void
    {
        $seller = User::where('role', 'user')->first();

        if (! $seller) {
            $seller = User::create([
                'user_id'       => Str::uuid(),
                'name'          => 'Demo Seller',
                'email'         => 'seller@demo.com',
                'phone'         => '+8801711111111',
                'password_hash' => bcrypt('DemoPass1!'),
                'role'          => 'user',
                'is_blocked'    => false,
            ]);
        }

        $listings = [
            [
                'title' => 'Vintage Leather Jacket',
                'description' => 'Genuine brown leather jacket in excellent condition. Size M, perfect for autumn. Only worn a handful of times. No tears or stains.',
                'price' => 85.00,
                'condition' => 'Like New',
                'category_id' => 1,
                'location' => 'Dhaka, Gulshan',
            ],
            [
                'title' => 'Harry Potter Box Set (7 Books)',
                'description' => 'Complete Harry Potter series in hardcover. All books in great condition with dust jackets intact. A must-have for any fan.',
                'price' => 45.00,
                'condition' => 'Good',
                'category_id' => 2,
                'location' => 'Dhaka, Banani',
            ],
            [
                'title' => 'Handmade Ceramic Mug Set (4 pcs)',
                'description' => 'Set of 4 handmade ceramic mugs with unique glazed patterns. Microwave and dishwasher safe. Each mug holds 300ml.',
                'price' => 32.00,
                'condition' => 'New',
                'category_id' => 3,
                'location' => 'Dhaka, Uttara',
            ],
            [
                'title' => 'Summer Floral Dress',
                'description' => 'Beautiful floral print dress, size S. Lightweight cotton fabric, perfect for summer. Worn once to a wedding.',
                'price' => 28.00,
                'condition' => 'Like New',
                'category_id' => 1,
                'location' => 'Dhaka, Mirpur',
            ],
            [
                'title' => 'Calculus Textbook - Thomas 14th Ed',
                'description' => 'Thomas Calculus, 14th edition. Clean with minor highlighting in first 3 chapters. Includes access code (may be expired).',
                'price' => 25.00,
                'condition' => 'Good',
                'category_id' => 2,
                'location' => 'Dhaka, Dhanmondi',
            ],
            [
                'title' => 'Oil Painting Set - 24 Colors',
                'description' => 'Professional oil paint set with 24 vibrant colors. Includes brushes, palette, and canvas pad. Only a few colors used.',
                'price' => 55.00,
                'condition' => 'Like New',
                'category_id' => 3,
                'location' => 'Dhaka, Gulshan',
            ],
            [
                'title' => 'Denim Jacket - Classic Blue',
                'description' => 'Classic blue denim jacket, size L. Great for layering. Slight fading on elbows gives it a vintage look.',
                'price' => 40.00,
                'condition' => 'Good',
                'category_id' => 1,
                'location' => 'Dhaka, Mohakhali',
            ],
            [
                'title' => 'The Alchemist - Paulo Coelho',
                'description' => 'Bestselling novel in excellent condition. Paperback, 208 pages. A timeless story about following your dreams.',
                'price' => 8.00,
                'condition' => 'Like New',
                'category_id' => 2,
                'location' => 'Dhaka, Bashundhara',
            ],
        ];

        foreach ($listings as $data) {
            Listing::create([
                'listing_id'   => Str::uuid(),
                'seller_id'    => $seller->user_id,
                'category_id'  => $data['category_id'],
                'title'        => $data['title'],
                'description'  => $data['description'],
                'price'        => $data['price'],
                'condition'    => $data['condition'],
                'images'       => [],
                'status'       => 'active',
                'location'     => $data['location'],
                'expires_at'   => now()->addDays(30),
            ]);
        }

        $this->command->info('Created ' . count($listings) . ' sample listings');
    }
}
