'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import StarRating from '@/components/StarRating'
import Link from 'next/link'

export default function ReviewsSection({ sellerId }: { sellerId: string }) {
  const [reviews, setReviews]   = useState<any[]>([])
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get(`/sellers/${sellerId}/reviews`)
      .then((res) => {
        setReviews(res.data.data.reviews?.data || [])
        setAvgRating(res.data.data.avg_rating || null)
        setReviewCount(res.data.data.reviews?.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sellerId])

  if (loading) return null

  return (
    <div className="mt-6 pt-4 border-t border-stone-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-stone-900">Seller Reviews</h3>
        <Link href={`/sellers/${sellerId}`} className="text-sm text-blue-600 hover:underline">
          View all reviews →
        </Link>
      </div>
      
      {/* Rating Summary */}
      <div className="bg-stone-50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-stone-900">{avgRating ?? '-'}</div>
            <div className="text-xs text-stone-500">out of 5</div>
          </div>
          <div className="flex-1">
            <StarRating rating={avgRating ?? 0} />
            <p className="text-sm text-stone-500 mt-1">
              Based on {reviewCount} review{reviewCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-stone-400">No reviews yet. Be the first to review this seller!</p>
      ) : (
        <div className="space-y-3">
          {reviews.slice(0, 5).map((review: any) => (
            <div key={review.review_id} className="bg-white border border-stone-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                  {review.buyer?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-stone-700">{review.buyer?.name}</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-xs ${i < review.rating ? 'text-amber-400' : 'text-stone-200'}`}>★</span>
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-xs text-stone-600 leading-relaxed">{review.comment}</p>
              )}
              {review.seller_response && (
                <div className="mt-2 pl-2 border-l-2 border-blue-200">
                  <p className="text-xs font-medium text-stone-500">Seller response:</p>
                  <p className="text-xs text-stone-600 italic">{review.seller_response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}