'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import type { Listing } from '@/lib/types'
import AuthGuard from '@/components/layout/AuthGuard'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ListingCard from '@/components/listings/ListingCard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Send } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'interested', label: 'Interested' },
  { value: 'sold', label: 'Sold' },
  { value: 'archived', label: 'Archived' },
]

export default function SellerListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) {
      try {
        const user = JSON.parse(raw)
        if (user.role === 'admin') {
          router.replace('/admin')
          return
        }
      } catch {}
    }
  }, [router])

  const fetchListings = (status: string) => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (status !== 'all') params.status = status
    api.get('/my-listings', { params })
      .then(({ data }) => setListings(data.data || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchListings(tab) }, [tab])

  const publish = async (id: string) => {
    try {
      await api.patch(`/listings/${id}/status`, { status: 'active' })
      toast.success('Listing published!')
      fetchListings(tab)
    } catch (err: any) {
      toast.error(err.response?.data?.meta?.message || 'Failed to publish')
    }
  }

  const payAndPublish = async (id: string) => {
    try {
      const { data } = await api.post('/payments/checkout', { listing_ids: [id] })
      window.location.href = data.data.checkout_url
    } catch (err: any) {
      toast.error(err.response?.data?.meta?.message || 'Payment failed')
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout role="seller">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Listings</h1>
              <p className="text-sm text-muted-foreground">Manage all your listings</p>
            </div>
            <Link href="/listings/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Listing
              </Button>
            </Link>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-6">
              {statusTabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
              ))}
            </TabsList>

            {statusTabs.map((t) => (
              <TabsContent key={t.value} value={t.value}>
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
                    ))}
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground mb-4">No {t.label.toLowerCase()} listings</p>
                    {t.value === 'draft' && (
                      <Link href="/listings/create">
                        <Button>Create your first listing</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.map((l) => (
                      <div key={l.listing_id} className="relative group">
                        <ListingCard listing={l} />
                        {l.status === 'draft' && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-xl">
                            <Button size="sm" onClick={() => payAndPublish(l.listing_id)}>
                              <Send className="w-3 h-3 mr-1" />
                              Pay &amp; Publish
                            </Button>
                            <button onClick={() => publish(l.listing_id)} className="text-xs text-white/70 hover:text-white underline">
                              Publish directly (dev)
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
