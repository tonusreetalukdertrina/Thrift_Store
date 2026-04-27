<?php

namespace App\Console\Commands;

use App\Models\Listing;
use App\Models\Notification;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ArchiveExpiredListings extends Command
{
    protected $signature   = 'listings:archive';
    protected $description = 'Archive listings that have passed their expiry date';

    public function handle()
    {
        $soonExpiring = Listing::where('status', 'active')
            ->whereDate('expires_at', now()->addDays(5)->toDateString())
            ->get();

        foreach ($soonExpiring as $listing) {
            Notification::create([
                'notification_id' => Str::uuid(),
                'user_id'         => $listing->seller_id,
                'type'            => 'listing_expiring_soon',
                'body'            => "Your listing \"{$listing->title}\" will expire in 5 days.",
                'status'          => 'unread',
            ]);
        }

        $expired = Listing::where('status', 'active')
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($expired as $listing) {
            $listing->update(['status' => 'archived']);

            Notification::create([
                'notification_id' => Str::uuid(),
                'user_id'         => $listing->seller_id,
                'type'            => 'listing_archived',
                'body'            => "Your listing \"{$listing->title}\" has been archived after 60 days.",
                'status'          => 'unread',
            ]);
        }

        $this->info("Archived {$expired->count()} listings. Notified {$soonExpiring->count()} sellers of upcoming expiry.");
    }
}
