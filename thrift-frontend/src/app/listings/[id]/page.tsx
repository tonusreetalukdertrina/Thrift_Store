'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Listing } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import {
  Star,
  MapPin,
  User as UserIcon,
  ArrowLeft,
  Heart,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Tag,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || ''

function getImageUrl(path: string): string {
  return path.startsWith('http') ? path : `${storageUrl}${path}`
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  interested: { label: 'Interested', variant: 'outline' },
  sold: { label: 'Sold', variant: 'secondary' },
  archived: { label: 'Archived', variant: 'secondary' },
}

const conditionConfig: Record<string, { label: string; className: string }> = {
  New: { label: 'New', className: 'bg-primary/10 text-primary border-primary/20' },
  'Like New': { label: 'Like New', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  Good: { label: 'Good', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  Fair: { label: 'Fair', className: 'bg-orange-50 text-orange-700 border-orange-200' },
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [listing, setListing] = useState<Listing | null>(null)
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

  const nextImg = () => {
    if (listing?.images && selectedImg < listing.images.length - 1) setSelectedImg(selectedImg + 1)
  }
  const prevImg = () => {
    if (selectedImg > 0) setSelectedImg(selectedImg - 1)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-24" />
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <Skeleton className="aspect-[4/3] rounded-xl" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-1/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!listing) return null

  const isOwner = user?.user_id === listing.seller_id
  const isInterested = listing.interested_buyer_id === user?.user_id
  const isBuyer = user?.role === 'user'
  const status = statusConfig[listing.status] || { label: listing.status, variant: 'secondary' as const }
  const condition = conditionConfig[listing.condition] || { label: listing.condition, className: '' }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Breadcrumb */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link href="/search" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to listings
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative aspect-[4/3] rounded-xl bg-card overflow-hidden border">
              {listing.images?.[selectedImg] ? (
                <img
                  src={getImageUrl(listing.images[selectedImg])}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
              )}
              {listing.images && listing.images.length > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    disabled={selectedImg === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed border"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImg}
                    disabled={selectedImg >= listing.images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed border"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className={condition.className} variant="outline">
                  {condition.label}
                </Badge>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>

            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {listing.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      i === selectedImg ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <h1 className="text-2xl font-bold">{listing.title}</h1>
              {listing.category && (
                <div className="flex items-center gap-2 mt-1">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{listing.category.category_name}</p>
                </div>
              )}
            </div>

            <p className="text-3xl font-bold text-primary">${parseFloat(listing.price).toFixed(2)}</p>

            {listing.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {listing.location}
              </p>
            )}

            <Separator />

            {/* Seller Card */}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">Seller</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold text-lg shrink-0">
                    {listing.seller?.name?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{listing.seller?.name || 'Unknown'}</p>
                    {listing.seller_avg_rating && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {listing.seller_avg_rating.toFixed(1)} rating
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Member since {new Date(listing.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Seller Contact - shown to logged-in buyers */}
                {!isOwner && user && listing.seller?.phone && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-xs font-semibold tracking-wider uppercase text-primary">Contact Seller</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{listing.seller.phone}</span>
                    </div>
                  </div>
                )}

                {/* Owner sees interested buyer info */}
                {isOwner && listing.interested_buyer && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-xs font-semibold tracking-wider uppercase text-primary">Interested Buyer</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                        {listing.interested_buyer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{listing.interested_buyer.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {listing.interested_buyer.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              {isOwner ? (
                <>
                  <Link href={`/listings/${listing.listing_id}/edit`}>
                    <Button className="w-full" variant="outline">Edit listing</Button>
                  </Link>
                </>
              ) : isBuyer ? (
                <>
                  {isInterested ? (
                    <>
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
              ) : !user ? (
                <Link href="/auth/login">
                  <Button className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Sign in to express interest
                  </Button>
                </Link>
              ) : null}
            </div>

            {/* Description */}
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">Description</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{listing.description}</p>
              </CardContent>
            </Card>

            {/* Trust Badge */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <Shield className="w-4 h-4 text-primary" />
              Secure transaction &middot; ThriftStore guarantees safe exchanges
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
