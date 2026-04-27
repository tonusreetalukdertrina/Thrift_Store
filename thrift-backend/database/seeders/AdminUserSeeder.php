<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('users')->insert([
            'user_id'      => Str::uuid(),
            'name'         => 'Platform Admin',
            'email'        => 'admin@thriftstore.com',
            'phone'        => '+8801700000000',
            'password_hash'=> bcrypt('Admin@1234'),
            'role'         => 'admin',
            'is_blocked'   => false,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);
    }
}
