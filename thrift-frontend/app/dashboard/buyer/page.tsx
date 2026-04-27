'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import AuthGuard from '@/components/AuthGuard'

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  dispatched: 'bg-purple-100 text-purple-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}

export default function BuyerDashboard() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [orders, setOrders]       = useState<any[]>([])
  const [wishlist, setWishlist]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'history'>('orders')
  const [reviewForm, setReviewForm] = useState<{ orderId: string; rating: number; comment: string } | null>(null)
  const [reviewMsg, setReviewMsg] = useState('')
  

  useEffect(() => {
    Promise.all([
      api.get('/orders'),
      api.get('/wishlist'),
    ]).then(([ordersRes, wishlistRes]) => {
      setOrders(ordersRes.data.data.data || [])
      setWishlist(wishlistRes.data.data || [])
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, []) 

  const handleCancel = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return
    try {
      await api.patch(`/orders/${orderId}/cancel`, { cancel_reason: 'Cancelled by buyer' })
      setOrders(orders.map((o) =>
        o.order_id === orderId ? { ...o, status: 'cancelled' } : o
      ))
    } catch (err: any) {
      alert(err.response?.data?.meta?.message || 'Cannot cancel')
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewForm) return
    try {
      await api.post('/reviews', {
        order_id: reviewForm.orderId,
        rating:   reviewForm.rating,
        comment:  reviewForm.comment,
      })
      setReviewMsg('Review submitted!')
      setReviewForm(null)
      // Refresh orders
      const res = await api.get('/orders')
      setOrders(res.data.data.data || [])
    } catch (err: any) {
      setReviewMsg(err.response?.data?.meta?.message || 'Failed')
    }
  }

  const removeWishlist = async (productId: string) => {
    await api.delete(`/wishlist/${productId}`)
    setWishlist(wishlist.filter((w) => w.product_id !== productId))
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-10 text-gray-400">Loading...</div>
  }

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['orders', 'history', 'wishlist'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'orders' && ` (${orders.length})`}
            {tab === 'wishlist' && ` (${wishlist.length})`}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {activeTab === 'orders' && (
  <div className="space-y-4">
    {orders.filter((o) => !['completed','cancelled'].includes(o.status)).length === 0
      && orders.filter((o) => ['completed','cancelled'].includes(o.status)).length === 0 ? (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">🤝</p>
        <p>No interests yet.</p>
        <Link href="/search" className="mt-3 inline-block text-blue-600 text-sm hover:underline">
          Browse listings
        </Link>
      </div>
    ) : (
      orders.map((order) => (
        <div key={order.order_id} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3 flex-1 min-w-0">
              {order.product?.images?.[0] && (
                <img
                  src={`http://localhost:8000${order.product.images[0]}`}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <div className="min-w-0">
                <Link
                  href={`/products/${order.product_id}`}
                  className="font-medium text-gray-900 hover:text-blue-600 text-sm truncate block"
                >
                  {order.product?.title}
                </Link>
                <p className="text-sm font-bold text-blue-600 mt-0.5">
                  ৳{parseFloat(order.product?.price || 0).toLocaleString('en-BD')}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
              order.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
              order.status === 'confirmed' ? 'bg-green-100 text-green-700'  :
              order.status === 'completed' ? 'bg-blue-100 text-blue-700'    :
              'bg-red-100 text-red-700'
            }`}>
              {order.status === 'pending'   ? '○ Pending seller response' :
               order.status === 'confirmed' ? '✓ Seller confirmed!'       :
               order.status === 'completed' ? '★ Completed'               :
               '✕ Cancelled'}
            </span>
          </div>

          {/* Status descriptions */}
          <div className="mt-3 text-xs bg-gray-50 px-3 py-2 rounded-lg text-gray-500">
            {order.status === 'pending'   && '⏳ Waiting for seller to confirm your interest. They can see your contact details.'}
            {order.status === 'confirmed' && '🎉 The seller confirmed! Contact them to arrange pickup/delivery.'}
            {order.status === 'completed' && '★ Transaction complete.'}
            {order.status === 'cancelled' && '✕ This interest was cancelled.'}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3 flex-wrap">

            {/* Cancel interest */}
            {['pending'].includes(order.status) && (
              <button
                onClick={() => handleCancel(order.order_id)}
                className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
              >
                Cancel interest
              </button>
            )}

            {/* Leave review */}
            {order.status === 'completed' && !order.review && (
              <button
                onClick={() => setReviewForm({ orderId: order.order_id, rating: 5, comment: '' })}
                className="text-xs text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition"
              >
                ⭐ Leave a review
              </button>
            )}

            {order.review && (
              <span className="text-xs text-green-600 border border-green-200 px-3 py-1.5 rounded-lg">
                ✓ Reviewed
              </span>
            )}
          </div>
        </div>
      ))
    )}
  </div>
)}

      {activeTab === 'wishlist' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {wishlist.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">❤️</p>
              <p>Your wishlist is empty.</p>
            </div>
          ) : (
            wishlist.map((item) => (
              <div key={item.wishlist_id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <Link href={`/products/${item.product_id}`}>
                  <img
                    src={item.product?.images?.[0]
                      ? `http://localhost:8000${item.product.images[0]}`
                      : '/placeholder.png'}
                    alt=""
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product?.title}</p>
                    <p className="text-sm font-bold text-blue-600 mt-1">
                      ${parseFloat(item.product?.price || 0).toFixed(2)}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => removeWishlist(item.product_id)}
                  className="w-full text-xs text-red-400 hover:text-red-600 py-2 border-t border-gray-100"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
  <div className="space-y-3">
    {orders.filter((o) => o.status === 'completed' || o.status === 'cancelled').length === 0 ? (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p>No purchase history yet.</p>
      </div>
    ) : (
      orders
        .filter((o) => o.status === 'completed' || o.status === 'cancelled')
        .map((order) => (
          <div key={order.order_id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              {order.product?.images?.[0] && (
                <img
                  src={`http://127.0.0.1:8000${order.product.images[0]}`}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {order.product?.title}
                </p>
                <p className="text-sm font-bold text-blue-600 mt-0.5">
                  ${parseFloat(order.product?.price || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {order.status}
              </span>
            </div>
            {order.status === 'completed' && !order.review && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setReviewForm({ orderId: order.order_id, rating: 5, comment: '' })}
                  className="text-xs text-blue-600 hover:underline"
                >
                  ⭐ Leave a review
                </button>
              </div>
            )}
            {order.review && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-xs ${i < order.review.rating ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
                ))}
                <span className="text-xs text-gray-500 ml-1">You reviewed this</span>
              </div>
            )}
          </div>
        ))
    )}
  </div>
)}

      {reviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Leave a review</h2>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">How would you rate this seller?</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    onMouseEnter={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="text-3xl transition-all hover:scale-110 focus:outline-none"
                  >
                    <span className={star <= reviewForm.rating ? 'text-amber-400' : 'text-gray-300'}>★</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reviewForm.rating === 1 && 'Poor'}
                {reviewForm.rating === 2 && 'Fair'}
                {reviewForm.rating === 3 && 'Good'}
                {reviewForm.rating === 4 && 'Very Good'}
                {reviewForm.rating === 5 && 'Excellent'}
              </p>
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Write your review (optional)..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            {reviewMsg && (
              <p className="text-sm text-green-600 mb-3">{reviewMsg}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setReviewForm(null); setReviewMsg('') }}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                Submit review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  )
}