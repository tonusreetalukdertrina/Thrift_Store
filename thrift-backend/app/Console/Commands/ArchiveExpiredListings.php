<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ArchiveExpiredListings extends Command
{
    protected $signature   = 'listings:archive';
    protected $description = 'Archive listings that have passed their expiry date';

    public function handle()
    {
        // Notify sellers 5 days before expiry (day 55)
        $soonExpiring = Product::where('status', 'active')
            ->whereDate('expires_at', now()->addDays(5)->toDateString())
            ->get();

        foreach ($soonExpiring as $product) {
            Notification::create([
                'notification_id' => Str::uuid(),
                'user_id'         => $product->seller_id,
                'type'            => 'listing_expiring_soon',
                'body'            => "Your listing \"{$product->title}\" will expire in 5 days.",
                'status'          => 'unread',
            ]);
        }

        // Archive expired listings
        $expired = Product::where('status', 'active')
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($expired as $product) {
            $product->update(['status' => 'archived']);

            Notification::create([
                'notification_id' => Str::uuid(),
                'user_id'         => $product->seller_id,
                'type'            => 'listing_archived',
                'body'            => "Your listing \"{$product->title}\" has been archived after 60 days.",
                'status'          => 'unread',
            ]);
        }

        $this->info("Archived {$expired->count()} listings. Notified {$soonExpiring->count()} sellers of upcoming expiry.");
    }
}