'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'

export default function AdminListingsPage() {
  return (
    <AuthGuard adminOnly>
      <AdminListingsContent />
    </AuthGuard>
  )
}

function AdminListingsContent() {
  const [listings, setListings]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [status, setStatus]       = useState('')
  const [q, setQ]                 = useState('')
  const [acting, setActing]       = useState<string | null>(null)
  const [adminArchived, setAdminArchived] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchListings()
    fetchAdminArchived()
  }, [status])

  const fetchAdminArchived = async () => {
    try {
      const res = await api.get('/admin/audit-log', {
        params: { action: 'remove_product' }
      })
      const logs = res.data.data?.data || []
      const ids  = new Set<string>(logs.map((l: any) => l.target_id))
      setAdminArchived(ids)
    } catch (_) {}
  }

  const fetchListings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/products', { params: { status, q } })
      setListings(res.data.data.data || [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  const removeListing = async (productId: string, title: string) => {
    if (!confirm(`Remove listing "${title}"?`)) return
    setActing(productId)
    try {
      await api.delete(`/admin/products/${productId}`)
      setListings(listings.map((l) =>
        l.product_id === productId ? { ...l, status: 'archived' } : l
      ))
      setAdminArchived((prev) => new Set([...prev, productId]))
    } catch (err: any) {
      alert(err.response?.data?.meta?.message || 'Failed')
    } finally { setActing(null) }
  }

  const restoreListing = async (productId: string) => {
    if (!confirm('Restore this listing?')) return
    setActing(productId)
    try {
      await api.patch(`/admin/products/${productId}/restore`)
      setListings(listings.map((l) =>
        l.product_id === productId ? { ...l, status: 'active' } : l
      ))
    } catch (err: any) {
      alert(err.response?.data?.meta?.message || 'Failed')
    } finally { setActing(null) }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
        <Link href="/admin/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
          placeholder="Search title..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
          <option value="sold">Sold</option>
        </select>
        <button
          onClick={fetchListings}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-blue-700 transition"
        >
          Filter
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {listings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No listings found</div>
          ) : (
            listings.map((listing) => (
              <div
                key={listing.product_id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4"
              >
                <img
                  src={listing.images?.[0]
                    ? `http://127.0.0.1:8000${listing.images[0]}`
                    : '/placeholder.png'}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${listing.product_id}`}
                    className="font-medium text-gray-900 hover:text-blue-600 text-sm truncate block"
                    target="_blank"
                  >
                    {listing.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {listing.seller?.name} · {listing.seller?.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    ${parseFloat(listing.price).toFixed(2)} · {listing.category?.category_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    listing.status === 'active'   ? 'bg-green-100 text-green-700'  :
                    listing.status === 'draft'    ? 'bg-yellow-100 text-yellow-700':
                    listing.status === 'sold'     ? 'bg-blue-100 text-blue-700'    :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {listing.status}
                  </span>

                  {listing.status === 'archived' && (
                    <button
                      onClick={() => restoreListing(listing.product_id)}
                      disabled={acting === listing.product_id}
                      className="text-xs text-green-600 border border-green-300 px-3 py-1 rounded-lg hover:bg-green-50 transition disabled:opacity-50"
                    >
                      {acting === listing.product_id ? '...' : 'Restore'}
                    </button>
                  )}

                  {listing.status !== 'archived' && (
                    <button
                      onClick={() => removeListing(listing.product_id, listing.title)}
                      disabled={acting === listing.product_id}
                      className="text-xs text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {acting === listing.product_id ? '...' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}