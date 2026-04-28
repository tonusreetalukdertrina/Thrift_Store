'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Users, Package, AlertTriangle, DollarSign, Ban } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  total_users: number
  total_active_listings: number
  total_revenue: string
  pending_reports: number
  blocked_users: number
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/')
  }, [user, router])

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>

  const cards = [
    { label: 'Total Users', value: stats?.total_users ?? 0, icon: Users, href: '/admin/users' },
    { label: 'Active Listings', value: stats?.total_active_listings ?? 0, icon: Package, href: '/admin/listings' },
    { label: 'Revenue', value: stats?.total_revenue ? `$${parseFloat(stats.total_revenue).toFixed(2)}` : '$0.00', icon: DollarSign },
    { label: 'Pending Reports', value: stats?.pending_reports ?? 0, icon: AlertTriangle, href: '/admin/reports' },
    { label: 'Blocked Users', value: stats?.blocked_users ?? 0, icon: Ban, href: '/admin/users' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className={c.href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={() => c.href && router.push(c.href)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
              <c.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Link href="/admin/users"><Button variant="outline" className="w-full">Manage Users</Button></Link>
        <Link href="/admin/listings"><Button variant="outline" className="w-full">Manage Listings</Button></Link>
        <Link href="/admin/reports"><Button variant="outline" className="w-full">Manage Reports</Button></Link>
        <Link href="/admin/categories"><Button variant="outline" className="w-full">Categories</Button></Link>
        <Link href="/admin/payments"><Button variant="outline" className="w-full">Payments</Button></Link>
        <Link href="/admin/audit-log"><Button variant="outline" className="w-full">Audit Log</Button></Link>
      </div>
    </div>
  )
}
