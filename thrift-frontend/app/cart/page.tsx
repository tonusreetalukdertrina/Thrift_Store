'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import AuthGuard from '@/components/AuthGuard'

const API_BASE = 'http://127.0.0.1:8000'

export default function CartPage() {
  return (
    <AuthGuard>
      <CartContent />
    </AuthGuard>
  )
}

function CartContent() {
  const router              = useRouter()
  const { user }            = useAuthStore()
  const { items, removeItem, clearCart, total, loadCart } = useCartStore()
  const [ordering, setOrdering]   = useState(false)
  const [orderResults, setOrderResults] = useState<any[]>([])
  const [done, setDone]           = useState(false)

  useEffect(() => {
    loadCart()
  }, [])

  const handleRemove = (productId: string) => {
    removeItem(productId)
  }

  const handleOrderAll = async () => {
    if (items.length === 0) return
    setOrdering(true)
    const results: any[] = []

    for (const item of items) {
      try {
        const res = await api.post('/orders', { product_id: item.product_id })
        results.push({ ...item, success: true, order_id: res.data.data.order_id })
      } catch (err: any) {
        results.push({
          ...item,
          success: false,
          error: err.response?.data?.meta?.message || 'Failed',
        })
      }
    }

    setOrderResults(results)
    setDone(true)

    // Clear successfully ordered items from cart
    const failedIds = results.filter((r) => !r.success).map((r) => r.product_id)
    if (failedIds.length === 0) {
      clearCart()
    } else {
      results.filter((r) => r.success).forEach((r) => removeItem(r.product_id))
    }

    setOrdering(false)
  }

  if (done) {
    const successful = orderResults.filter((r) => r.success)
    const failed     = orderResults.filter((r) => !r.success)

    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">{failed.length === 0 ? '🎉' : '⚠️'}</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {failed.length === 0 ? 'All orders placed!' : 'Some orders placed'}
          </h1>

          {successful.length > 0 && (
            <div className="mt-4 text-left space-y-2">
              <p className="text-sm font-medium text-green-700 mb-2">
                ✓ {successful.length} order{successful.length !== 1 ? 's' : ''} placed successfully
              </p>
              {successful.map((r) => (
                <div key={r.product_id} className="flex justify-between text-sm bg-green-50 rounded-lg px-3 py-2">
                  <span className="text-gray-700 truncate">{r.title}</span>
                  <Link
                    href={`/orders/${r.order_id}/messages`}
                    className="text-blue-600 hover:underline ml-2 flex-shrink-0"
                  >
                    Message seller
                  </Link>
                </div>
              ))}
            </div>
          )}

          {failed.length > 0 && (
            <div className="mt-4 text-left space-y-2">
              <p className="text-sm font-medium text-red-600 mb-2">
                ✗ {failed.length} order{failed.length !== 1 ? 's' : ''} failed
              </p>
              {failed.map((r) => (
                <div key={r.product_id} className="flex justify-between text-sm bg-red-50 rounded-lg px-3 py-2">
                  <span className="text-gray-700 truncate">{r.title}</span>
                  <span className="text-red-500 ml-2 flex-shrink-0 text-xs">{r.error}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Link
              href="/dashboard/buyer"
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition text-center"
            >
              View my orders
            </Link>
            <Link
              href="/search"
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition text-center"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Cart ({items.length})
        </h1>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-sm text-red-400 hover:text-red-600"
          >
            Clear cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-gray-500 mb-6">Your cart is empty</p>
          <Link
            href="/search"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <>
          {/* Off-platform notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-xs text-amber-700">
            Delivery is arranged directly between you and each seller outside the platform.
          </div>

          {/* Cart items */}
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image.startsWith('/storage')
                        ? `${API_BASE}${item.image}`
                        : item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                      📷
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.product_id}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{item.condition}</p>
                  <p className="text-sm font-bold text-blue-600 mt-1">
                    ${item.price.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => handleRemove(item.product_id)}
                  className="text-gray-300 hover:text-red-400 transition text-xl flex-shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 text-sm">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xl font-bold text-gray-900">
                ${total().toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Each item will create a separate order with its seller.
              You can message each seller individually to arrange delivery.
            </p>

            <button
              onClick={handleOrderAll}
              disabled={ordering}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {ordering
                ? `Placing ${items.length} order${items.length !== 1 ? 's' : ''}...`
                : `Place ${items.length} order${items.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}