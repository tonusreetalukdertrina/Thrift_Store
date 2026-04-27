'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import AuthGuard from '@/components/AuthGuard'

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [stats, setStats]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <AuthGuard adminOnly>
        <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <span className="text-sm text-gray-500">Logged in as {user?.name}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total users',      value: stats?.total_users ?? 0,           color: 'text-blue-600' },
          { label: 'Active listings',  value: stats?.total_active_listings ?? 0, color: 'text-green-600' },
          { label: 'Total revenue',    value: `$${parseFloat(stats?.total_revenue || 0).toFixed(2)}`, color: 'text-purple-600' },
          { label: 'Total orders',     value: stats?.total_orders ?? 0,          color: 'text-amber-600' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Orders by status</p>
          {stats?.orders_by_status && Object.entries(stats.orders_by_status).map(([status, count]: any) => (
            <div key={status} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
              <span className="capitalize text-gray-600">{status}</span>
              <span className="font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Moderation</p>
          <div className="flex justify-between text-sm py-1 border-b border-gray-50">
            <span className="text-gray-600">Pending reports</span>
            <span className={`font-medium ${stats?.pending_reports > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {stats?.pending_reports ?? 0}
            </span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-gray-600">Blocked users</span>
            <span className="font-medium text-gray-900">{stats?.blocked_users ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/users',     label: 'Manage users',    emoji: '👥' },
          { href: '/admin/listings',  label: 'Manage listings', emoji: '📋' },
          { href: '/admin/reports',   label: 'Flagged content', emoji: '🚩' },
          { href: '/admin/audit-log', label: 'Audit log',       emoji: '📜' },
          { href: '/admin/payments',  label: 'Transactions',    emoji: '💳' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition"
          >
            <p className="text-2xl mb-1">{link.emoji}</p>
            <p className="text-sm font-medium text-gray-700">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
    </AuthGuard>
  )
}