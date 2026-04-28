import Link from 'next/link'
import type { Listing } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'

const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || ''

const conditionStyles: Record<string, string> = {
  New: 'bg-primary/10 text-primary border-primary/20',
  'Like New': 'bg-blue-50 text-blue-700 border-blue-200',
  Good: 'bg-amber-50 text-amber-700 border-amber-200',
  Fair: 'bg-orange-50 text-orange-700 border-orange-200',
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const img = listing.images?.[0] ? `${storageUrl}${listing.images[0]}` : null

  return (
    <Link href={`/listings/${listing.listing_id}`} className="group block">
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {img ? (
            <img src={img} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
          )}
          <Badge className={`absolute top-2 left-2 ${conditionStyles[listing.condition] || ''}`} variant="outline">
            {listing.condition}
          </Badge>
        </div>
        <div className="p-3 space-y-1">
          <h3 className="font-medium text-sm line-clamp-1">{listing.title}</h3>
          <p className="text-lg font-bold text-primary">${parseFloat(listing.price).toFixed(2)}</p>
          {listing.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {listing.location}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
