'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import StarRating from '@/components/StarRating'

export default function SellerProfilePage() {
  const { id }  = useParams()
  const [data, setData]     = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/sellers/${id}`),
      api.get(`/sellers/${id}/reviews`),
    ])
      .then(([profileRes, reviewsRes]) => {
        setData(profileRes.data.data)
        setReviews(reviewsRes.data.data.reviews?.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <div className="bg-gray-200 rounded-2xl h-32 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center text-gray-400">Seller not found</div>

  const { seller, avg_rating, review_count, active_listings } = data

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Seller header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">
          {seller.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{seller.name}</h1>
          {avg_rating ? (
            <StarRating rating={avg_rating} />
          ) : (
            <p className="text-sm text-gray-400">No reviews yet</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {review_count} review{review_count !== 1 ? 's' : ''} · Member since{' '}
            {new Date(seller.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Active listings */}
      {active_listings?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active listings</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {active_listings.map((p: any) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.review_id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                    {review.buyer?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{review.buyer?.name}</span>
                  <StarRating rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600">{review.comment}</p>
                )}
                {review.seller_response && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-2 border-blue-300">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Seller response</p>
                    <p className="text-sm text-gray-600">{review.seller_response}</p>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}