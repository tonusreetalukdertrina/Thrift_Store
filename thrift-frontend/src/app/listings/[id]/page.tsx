'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Listing, Review } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Star, MapPin, User as UserIcon, ArrowLeft, Heart, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || ''

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  interested: 'Interested',
  sold: 'Sold',
  archived: 'Archived',
}

const conditionStyles: Record<string, string> = {
  New: 'bg-primary/10 text-primary border-primary/20',
  'Like New': 'bg-blue-50 text-blue-700 border-blue-200',
  Good: 'bg-amber-50 text-amber-700 border-amber-200',
  Fair: 'bg-orange-50 text-orange-700 border-orange-200',
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [listing, setListing] = useState<Listing | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImg, setSelectedImg] = useState(0)

  const fetchListing = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/listings/${params.id}`)
      setListing(data.data)
    } catch {
      toast.error('Listing not found')
      router.push('/search')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchListing() }, [params.id])

  const handleInterest = async () => {
    if (!user) return router.push('/auth/login')
    try {
      await api.patch(`/listings/${params.id}/status`, { status: 'interested' })
      toast.success('Interest sent! Seller will be notified.')
      fetchListing()
    } catch (err: any) {
      toast.error(err.response?.data?.meta?.message || 'Failed')
    }
  }

  const handleWithdraw = async () => {
    try {
      await api.patch(`/listings/${params.id}/status`, { status: 'active' })
      toast.success('Interest withdrawn')
      fetchListing()
    } catch {
      toast.error('Failed to withdraw')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-[400px] rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-6 w-1/4" />
      </div>
    )
  }

  if (!listing) return null

  const isOwner = user?.user_id === listing.seller_id
  const isInterested = listing.interested_buyer_id === user?.user_id
  const isBuyer = user?.role === 'user'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/search" className="mb-4 inline-block">
        <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="aspect-[4/3] rounded-xl bg-muted overflow-hidden">
            {listing.images?.[selectedImg] ? (
              <img
                src={`${storageUrl}${listing.images[selectedImg]}`}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          {listing.images && listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {listing.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${i === selectedImg ? 'border-primary' : 'border-border'}`}
                >
                  <img src={`${storageUrl}${img}`} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">{listing.title}</h1>
              <p className="text-sm text-muted-foreground">
                {listing.category?.category_name}
              </p>
            </div>
            <Badge className={conditionStyles[listing.condition]} variant="outline">
              {listing.condition}
            </Badge>
          </div>

          <p className="text-3xl font-bold text-primary">${parseFloat(listing.price).toFixed(2)}</p>

          {listing.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {listing.location}
            </p>
          )}

          <Separator />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">{listing.seller?.name || 'Unknown'}</p>
              {listing.seller_avg_rating && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {listing.seller_avg_rating.toFixed(1)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium text-sm mb-1">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
          </div>

          <div className="pt-2 space-y-2">
            {isOwner ? (
              <>
                <Link href={`/listings/${listing.listing_id}/edit`}>
                  <Button className="w-full" variant="outline">Edit listing</Button>
                </Link>
                {listing.interested_buyer && (
                  <div className="p-3 rounded-lg bg-accent text-sm space-y-1">
                    <p className="font-medium flex items-center gap-1"><UserIcon className="w-4 h-4" /> Interested buyer</p>
                    <p>{listing.interested_buyer.name}</p>
                    <p className="text-muted-foreground">{listing.interested_buyer.phone}</p>
                  </div>
                )}
              </>
            ) : isBuyer && (
              <>
                {isInterested ? (
                  <>
                    <div className="p-3 rounded-lg bg-accent text-sm space-y-1">
                      <p className="font-medium flex items-center gap-1"><UserIcon className="w-4 h-4" /> Contact Seller</p>
                    <p>{listing.seller?.name}</p>
                    {listing.seller?.phone && (
                      <p className="text-muted-foreground">{listing.seller.phone}</p>
                    )}
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleWithdraw}>
                      <Heart className="w-4 h-4 mr-2" />
                      Withdraw interest
                    </Button>
                  </>
                ) : listing.status === 'active' ? (
                  <Button className="w-full" onClick={handleInterest}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    I&apos;m interested
                  </Button>
                ) : null}
              </>
            )}

            <Badge variant="secondary" className="w-full justify-center py-2">
              {statusLabels[listing.status] || listing.status}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
