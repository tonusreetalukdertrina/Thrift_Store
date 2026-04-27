'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import AuthGuard from '@/components/AuthGuard'

export default function SellerDashboard() {
  return (
    <AuthGuard>
      <SellerDashboardContent />
    </AuthGuard>
  )
}

// Replace SELLER_ACTIONS with:
const SELLER_ACTIONS: Record<string, { label: string; action: string; desc: string; color: string }> = {
  pending: {
    action: 'confirm',
    label:  'Confirm deal',
    desc:   'Agree to sell — buyer will be notified and item marked as confirm',
    color:  'bg-green-600 hover:bg-green-700',
  },
  confirmed: {
    action: 'complete',
    label:  'Mark as completed',
    desc:   'Transaction fully done — unlocks buyer review',
    color:  'bg-blue-600 hover:bg-blue-700',
  },
}

function SellerDashboardContent() {
  const { user } = useAuthStore()

  const [listings, setListings]   = useState<any[]>([])
  const [orders, setOrders]       = useState<any[]>([])
  const [payments, setPayments]   = useState<any[]>([])
  const [due, setDue]             = useState<any>(null)
  const [stats, setStats]         = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<'listings' | 'orders' | 'payments'>('listings')
  const [updating, setUpdating]   = useState<string | null>(null)
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([])
  const [paying, setPaying]       = useState(false)
  const [selectAll, setSelectAll] = useState(false)

  const imageBase = 'http://localhost:8000'

  const loadData = async () => {
    try {
      const [listingsRes, ordersRes, paymentsRes, dueRes, statsRes] = await Promise.all([
        api.get('/seller/listings'),
        api.get('/seller/orders'),
        api.get('/payments'),
        api.get('/payments/due'),
        api.get('/seller/stats').catch(() => ({ data: { data: null } })),
      ])
      setListings(listingsRes.data.data || [])
      setOrders(ordersRes.data.data.data || [])
      setPayments(paymentsRes.data.data || [])
      setDue(dueRes.data.data)
      setStats(statsRes.data.data)
    } catch (_) {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadData()

    const params = new URLSearchParams(window.location.search)
    const shouldRefresh = params.get('refresh') === '1' || params.get('payment') === 'success'

    if (shouldRefresh) {
      const poll = setInterval(async () => {
        try {
          const res = await api.get('/seller/listings')
          const fresh = res.data.data || []
          setListings(fresh)
          if (fresh.some((l: any) => l.status === 'active')) clearInterval(poll)
        } catch (_) {}
      }, 3000)
      setTimeout(() => clearInterval(poll), 30000)
    }
  }, [])

  const refreshListings = async () => {
    try {
      const res = await api.get('/seller/listings')
      setListings(res.data.data || [])
    } catch (_) {}
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus })
      setOrders((prev) =>
        prev.map((o) => o.order_id === orderId ? { ...o, status: newStatus } : o)
      )
    } catch (err: any) {
      alert(err.response?.data?.meta?.message || 'Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  const markConfirm = async (id: string) => {
    if (!confirm('Mark as confirm?')) return
    try {
      await api.patch(`/products/${id}/confirm`)
      setListings((prev) => prev.map((l) => l.product_id === id ? { ...l, status: 'confirm' } : l))
    } catch (_) {}
  }

  const archiveListing = async (id: string) => {
    if (!confirm('Archive this listing?')) return
    try {
      await api.delete(`/products/${id}`)
      setListings((prev) => prev.map((l) => l.product_id === id ? { ...l, status: 'archived' } : l))
    } catch (_) {}
  }

  const toggleDraft = (id: string) => {
    setSelectedDrafts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
    if (selectAll) setSelectAll(false)
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedDrafts([])
      setSelectAll(false)
    } else {
      setSelectedDrafts(draftListings.map((l) => l.product_id))
      setSelectAll(true)
    }
  }

  const handlePayAndPublish = async () => {
    if (selectedDrafts.length === 0) return
    setPaying(true)
    try {
      const res = await api.post('/payments/checkout', { product_ids: selectedDrafts })
      if (res.data.data?.checkout_url) {
        window.location.href = res.data.data.checkout_url
      }
    } catch (err: any) {
      alert(err.response?.data?.meta?.message || 'Failed to create checkout')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 flex justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const draftListings  = listings.filter((l) => l.status === 'draft')
  const activeListings = listings.filter((l) => l.status === 'active')

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshListings}
            className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
          >
            🔄 Refresh
          </button>
          <Link
            href="/listings/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            + New listing
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active listings', value: activeListings.length,  color: 'text-green-600'  },
          { label: 'Drafts',          value: draftListings.length,   color: 'text-yellow-600' },
          { label: 'Total orders',    value: orders.length,          color: 'text-blue-600'   },
          { label: 'Fees paid',       value: `$${payments.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0).toFixed(2)}`, color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue */}
      {stats && stats.completed_orders > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Revenue & profit</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Gross revenue',     value: `$${stats.gross_revenue.toFixed(2)}`,     color: 'text-green-600' },
              { label: 'Listing fees paid', value: `$${stats.listing_fees_paid.toFixed(2)}`, color: 'text-red-500'   },
              { label: 'Net profit',        value: `$${stats.net_profit.toFixed(2)}`,        color: stats.net_profit >= 0 ? 'text-blue-600' : 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment due banner */}
      {due && due.draft_count > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-yellow-800">Payment Required</p>
              <p className="text-sm text-yellow-700">
                {due.draft_count} draft listing(s) · ${due.fee_per_listing} each · Total due: ${due.total_due.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handlePayAndPublish}
              disabled={selectedDrafts.length === 0 || paying}
              className="bg-yellow-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition disabled:opacity-50"
            >
              {paying
                ? 'Processing…'
                : `Pay $${(selectedDrafts.length * (due.fee_per_listing || 5)).toFixed(2)} & Publish`}
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="selectAll"
              checked={selectAll}
              onChange={toggleSelectAll}
              className="w-4 h-4"
            />
            <label htmlFor="selectAll" className="text-sm text-yellow-800 cursor-pointer">
              Select all ({due.draft_count} listing{due.draft_count !== 1 ? 's' : ''})
            </label>
          </div>

          <div className="space-y-2">
            {due.draft_products?.map((draft: any) => (
              <div
                key={draft.product_id}
                className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-yellow-100"
              >
                <input
                  type="checkbox"
                  checked={selectedDrafts.includes(draft.product_id)}
                  onChange={() => toggleDraft(draft.product_id)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 flex-1 truncate">{draft.title}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">${due.fee_per_listing}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['listings', 'orders', 'payments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'listings' && ` (${listings.length})`}
            {tab === 'orders'   && ` (${orders.length})`}
          </button>
        ))}
      </div>

      {/* ── Listings tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'listings' && (
        <div className="space-y-3">
          {listings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p>No listings yet.</p>
              <Link href="/listings/create" className="mt-3 inline-block text-blue-600 text-sm hover:underline">
                Create your first listing
              </Link>
            </div>
          ) : (
            listings.map((listing) => (
              <div
                key={listing.product_id}
                className={`bg-white border rounded-xl p-4 flex items-center gap-4 ${
                  listing.status === 'draft' && selectedDrafts.includes(listing.product_id)
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200'
                }`}
              >
                {/* Draft checkbox */}
                {listing.status === 'draft' && (
                  <input
                    type="checkbox"
                    checked={selectedDrafts.includes(listing.product_id)}
                    onChange={() => toggleDraft(listing.product_id)}
                    className="w-4 h-4 flex-shrink-0"
                  />
                )}

                {/* Image */}
                <img
                  src={listing.images?.[0] ? `${imageBase}${listing.images[0]}` : '/placeholder.png'}
                  alt={listing.title}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${listing.product_id}`}
                    className="font-medium text-gray-900 hover:text-blue-600 text-sm truncate block"
                  >
                    {listing.title}
                  </Link>
                  <p className="text-sm font-bold text-blue-600 mt-0.5">
                    ${parseFloat(listing.price).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {listing.category?.category_name || ''}
                    {listing.expires_at && listing.status === 'active' && (
                      <> · Expires {new Date(listing.expires_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    listing.status === 'active'   ? 'bg-green-100 text-green-700'  :
                    listing.status === 'draft'    ? 'bg-yellow-100 text-yellow-700':
                    listing.status === 'confirm'     ? 'bg-blue-100 text-blue-700'    :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {listing.status}
                  </span>

                  {(listing.status === 'active' || listing.status === 'draft') && (
                    <Link
                      href={`/listings/${listing.product_id}/edit`}
                      className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition"
                    >
                      ✎ Edit
                    </Link>
                  )}

                  {listing.status === 'active' && (
                    <>
                      <button
                        onClick={() => markConfirm(listing.product_id)}
                        className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 transition"
                      >
                        ✓ Confirm
                      </button>
                      <button
                        onClick={() => archiveListing(listing.product_id)}
                        className="text-xs text-red-400 border border-red-100 px-2 py-1 rounded hover:bg-red-50 transition"
                      >
                        Archive
                      </button>
                    </>
                  )}

                  {listing.status === 'draft' && (
                    <button
                      onClick={() => {
                        setSelectedDrafts([listing.product_id])
                        setTimeout(handlePayAndPublish, 50)
                      }}
                      className="text-xs text-yellow-600 border border-yellow-300 bg-yellow-50 px-2 py-1 rounded hover:bg-yellow-100 transition"
                    >
                      Pay & publish
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Orders tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
  <div className="space-y-3">
    {orders.length === 0 ? (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">🤝</p>
        <p>No interests yet.</p>
      </div>
    ) : (
      orders.map((order) => {
        const action = SELLER_ACTIONS[order.status]
        return (
          <div key={order.order_id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {order.product?.title}
                </p>

                {/* Buyer contact info — visible to seller */}
                <div className="mt-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-blue-700 mb-0.5">
                    Interested buyer
                  </p>
                  <p className="text-sm font-medium text-blue-900">
                    {order.buyer?.name}
                  </p>
                  {order.buyer?.phone && (
                    <a
                      href={`tel:${order.buyer.phone}`}
                      className="text-sm text-blue-600 font-medium hover:underline"
                    >
                      📞 {order.buyer.phone}
                    </a>
                  )}
                </div>

                {order.buyer_note && (
                  <p className="text-xs text-gray-500 mt-2 italic bg-gray-50 px-2 py-1 rounded">
                    Note: {order.buyer_note}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-1.5">
                  Expressed interest {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>

              <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                order.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                order.status === 'confirmed' ? 'bg-green-100 text-green-700'  :
                order.status === 'completed' ? 'bg-blue-100 text-blue-700'    :
                'bg-red-100 text-red-700'
              }`}>
                {order.status === 'pending'   ? '○ Pending'   :
                 order.status === 'confirmed' ? '✓ Confirmed' :
                 order.status === 'completed' ? '★ Completed' :
                 '✕ Cancelled'}
              </span>
            </div>

            {/* Action buttons */}
            {action && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">{action.desc}</p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setUpdating(order.order_id)
                      try {
                        await api.patch(`/orders/${order.order_id}/${action.action}`)
                        setOrders((prev) => prev.map((o) =>
                          o.order_id === order.order_id
                            ? { ...o, status: action.action === 'confirm' ? 'confirmed' : 'completed' }
                            : o
                        ))
                      } catch (err: any) {
                        alert(err.response?.data?.meta?.message || 'Failed')
                      } finally {
                        setUpdating(null)
                      }
                    }}
                    disabled={updating === order.order_id}
                    className={`text-sm text-white px-4 py-1.5 rounded-lg transition disabled:opacity-50 ${action.color}`}
                  >
                    {updating === order.order_id ? 'Updating…' : action.label}
                  </button>

                  <Link
                    href={`/orders/${order.order_id}/messages`}
                    className="text-sm border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  >
                    💬 Message
                  </Link>
                </div>
              </div>
            )}

            {/* Completed state */}
            {order.status === 'completed' && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                  ★ Transaction completed
                </p>
                <Link
                  href={`/orders/${order.order_id}/messages`}
                  className="text-xs text-gray-500 hover:text-blue-600 transition"
                >
                  💬 Messages
                </Link>
              </div>
            )}
          </div>
        )
      })
    )}
  </div>
)}

      {/* ── Payments tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">💳</p>
              <p>No payment receipts yet.</p>
            </div>
          ) : (
            payments.map((batch: any, index: number) => (
              <div
                key={index}
                className={`bg-white border rounded-xl overflow-hidden ${
                  batch.status === 'failed'  ? 'border-red-200'    :
                  batch.status === 'partial' ? 'border-yellow-200' :
                  'border-gray-200'
                }`}
              >
                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-3 border-b ${
                  batch.status === 'failed'  ? 'bg-red-50 border-red-100'    :
                  batch.status === 'partial' ? 'bg-yellow-50 border-yellow-100' :
                  'bg-gray-50 border-gray-100'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {batch.status === 'paid'    ? 'Payment receipt'  :
                         batch.status === 'failed'  ? 'Payment failed'   :
                         batch.status === 'pending' ? 'Payment pending'  :
                         'Partial payment'}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        batch.status === 'paid'    ? 'bg-green-100 text-green-700'  :
                        batch.status === 'failed'  ? 'bg-red-100 text-red-700'     :
                        batch.status === 'pending' ? 'bg-yellow-100 text-yellow-700':
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {batch.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {batch.paid_at
                        ? new Date(batch.paid_at).toLocaleString()
                        : new Date(batch.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    ${parseFloat(batch.total_amount).toFixed(2)}
                  </p>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-50">
                  {batch.products?.map((p: any) => (
                    <div key={p.payment_id} className="flex justify-between items-center px-4 py-2.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          p.status === 'paid'   ? 'bg-green-400' :
                          p.status === 'failed' ? 'bg-red-400'   :
                          'bg-yellow-400'
                        }`} />
                        <p className="text-sm text-gray-700 truncate">{p.title}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === 'paid'   ? 'bg-green-100 text-green-700'  :
                          p.status === 'failed' ? 'bg-red-100 text-red-700'     :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {p.status}
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          ${parseFloat(p.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-xs text-gray-400 font-mono truncate max-w-xs">
                    Ref: {batch.transaction_ref?.slice(0, 30)}…
                  </p>
                  <p className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {batch.item_count} listing{batch.item_count !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Retry failed */}
                {batch.status === 'failed' && (
                  <div className="px-4 py-3 bg-red-50 border-t border-red-100">
                    <p className="text-xs text-red-600 mb-2">
                      Payment failed. Your listings are still in draft.
                    </p>
                    <button
                      onClick={async () => {
                        const failedIds = batch.products
                          ?.filter((p: any) => p.status !== 'paid' && p.product_id)
                          .map((p: any) => p.product_id) || []
                        if (!failedIds.length) return
                        try {
                          const res = await api.post('/payments/checkout', { product_ids: failedIds })
                          if (res.data.data?.checkout_url) {
                            window.location.href = res.data.data.checkout_url
                          }
                        } catch (err: any) {
                          alert(err.response?.data?.meta?.message || 'Failed')
                        }
                      }}
                      className="text-xs bg-red-600 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 transition"
                    >
                      Retry payment
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}