'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Listing } from '@/lib/types'
import AuthGuard from '@/components/layout/AuthGuard'
import ListingCard from '@/components/listings/ListingCard'
import { Skeleton } from '@/components/ui/skeleton'

export default function BuyerDashboard() {
  const { user } = useAuthStore()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api.get('/listings', { params: { interested_buyer_id: user.user_id } })
      .then(({ data }) => setListings(data.data.data || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Interests</h1>
          <p className="text-sm text-muted-foreground">Listings you&apos;ve shown interest in</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">You haven&apos;t shown interest in any listings yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {listings.map((l) => (
              <ListingCard key={l.listing_id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
