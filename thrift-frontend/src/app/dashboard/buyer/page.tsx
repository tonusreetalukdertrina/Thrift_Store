'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Listing } from '@/lib/types'
import AuthGuard from '@/components/layout/AuthGuard'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ListingCard from '@/components/listings/ListingCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart, Eye, DollarSign, Package } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function BuyerDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'admin') {
      router.replace('/admin')
      return
    }
    if (!user) return
    api.get('/listings', { params: { interested_buyer_id: user.user_id } })
      .then(({ data }) => setListings(data.data.data || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [user])

  const statusCounts = listings.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  const totalValue = listings.reduce((sum, l) => sum + parseFloat(l.price), 0)

  const statCards = [
    { label: 'Interested', value: listings.length, icon: Heart, color: 'text-primary' },
    { label: 'Active', value: statusCounts.active || 0, icon: Eye, color: 'text-blue-500' },
    { label: 'Sold', value: statusCounts.sold || 0, icon: Package, color: 'text-amber-500' },
    { label: 'Total Value', value: `$${totalValue.toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
  ]

  return (
    <AuthGuard>
      <DashboardLayout role="seller">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">My Interests</h1>
            <p className="text-sm text-muted-foreground">Listings you&apos;ve shown interest in</p>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card) => (
                <Card key={card.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{card.label}</p>
                        <p className="text-2xl font-bold mt-1">{card.value}</p>
                      </div>
                      <card.icon className={`w-8 h-8 ${card.color} opacity-50`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interests by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1a6b4a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  No interests yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Listings */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16 text-muted-foreground">
                You haven&apos;t shown interest in any listings yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <ListingCard key={l.listing_id} listing={l} />
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
