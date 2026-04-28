'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Listing, PaginatedData } from '@/lib/types'
import AuthGuard from '@/components/layout/AuthGuard'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Package, DollarSign, Eye, TrendingUp, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#1a6b4a', '#3b82f6', '#f59e0b', '#8b5cf6', '#6b7280']

export default function SellerDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, active: 0, sold: 0, draft: 0, interested: 0, revenue: 0 })

  useEffect(() => {
    if (user?.role === 'admin') {
      router.replace('/admin')
      return
    }
  }, [user, router])

  useEffect(() => {
    if (user?.role === 'admin') return
    setLoading(true)
    api.get('/my-listings')
      .then(({ data }) => {
        const all: Listing[] = data.data || []
        setListings(all)
        const active = all.filter((l: Listing) => l.status === 'active').length
        const sold = all.filter((l: Listing) => l.status === 'sold').length
        const draft = all.filter((l: Listing) => l.status === 'draft').length
        const interested = all.filter((l: Listing) => l.status === 'interested').length
        setStats({
          total: all.length,
          active,
          sold,
          draft,
          interested,
          revenue: sold * 25,
        })
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [])

  const statusData = [
    { name: 'Active', value: stats.active },
    { name: 'Sold', value: stats.sold },
    { name: 'Draft', value: stats.draft },
    { name: 'Interested', value: stats.interested },
  ].filter((d) => d.value > 0)

  const recentListings = [...listings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const statCards = [
    { label: 'Total Listings', value: stats.total, icon: Package, change: '+12%', color: 'text-primary' },
    { label: 'Active', value: stats.active, icon: Eye, change: '+5%', color: 'text-blue-500' },
    { label: 'Sold', value: stats.sold, icon: DollarSign, change: '+8%', color: 'text-amber-500' },
    { label: 'Revenue', value: `$${stats.revenue}`, icon: TrendingUp, change: '+15%', color: 'text-primary' },
  ]

  return (
    <AuthGuard>
      <DashboardLayout role="seller">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
            <Link href="/listings/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Listing
              </Button>
            </Link>
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
                    <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                      <ArrowUpRight className="w-3 h-3 text-primary" />
                      <span className="text-primary font-medium">{card.change}</span>
                      <span>from last month</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Listings by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    No listings yet
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {statusData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Listing Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={statusData.length > 0 ? statusData : [{ name: 'None', value: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1a6b4a" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Listings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Listings</CardTitle>
              <Link href="/dashboard/seller/listings">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentListings.length > 0 ? (
                <div className="space-y-3">
                  {recentListings.map((listing) => (
                    <div
                      key={listing.listing_id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/listings/${listing.listing_id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{listing.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {listing.category?.category_name} &middot; {new Date(listing.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold">${parseFloat(listing.price).toFixed(2)}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          listing.status === 'active' ? 'bg-primary/10 text-primary' :
                          listing.status === 'sold' ? 'bg-amber-50 text-amber-700' :
                          listing.status === 'draft' ? 'bg-muted text-muted-foreground' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {listing.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No listings yet. Create your first listing to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
