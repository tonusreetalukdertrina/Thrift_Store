'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import ProductCard from '@/components/ProductCard'

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']

const CATEGORIES = [
  { id: 1, name: 'Second-hand Clothes' },
  { id: 2, name: 'Second-hand Books' },
  { id: 3, name: 'Arts & Crafts' },
]

const SUBCATEGORIES: Record<string, string[]> = {
  '1': ["Men's Clothing", "Women's Clothing", "Kids' Clothing"],
  '2': ['Textbooks', 'Fiction', 'Non-Fiction'],
  '3': ['Paintings', 'Jewellery', 'Pottery'],
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

interface Filters {
  q: string
  category_id: string
  subcategory_id: string
  condition: string
  min_price: string
  max_price: string
  sort: string
}

const DEFAULT_FILTERS: Filters = {
  q: '',
  category_id: '',
  subcategory_id: '',
  condition: '',
  min_price: '',
  max_price: '',
  sort: 'newest',
}

function SearchContent() {
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const { q, category_id, subcategory_id, condition, min_price, max_price, sort } = filters

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      q: searchParams.get('q') || '',
      category_id: searchParams.get('category_id') || '',
    }))
  }, [searchParams])

  const [debouncedQ, setDebouncedQ] = useState(q)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(t)
  }, [q])

  const fetchProducts = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params: Record<string, any> = { page }
        if (debouncedQ) params.q = debouncedQ
        if (category_id) params.category_id = category_id
        if (subcategory_id) params.subcategory_id = subcategory_id
        if (condition) params.condition = condition
        if (min_price) params.min_price = min_price
        if (max_price) params.max_price = max_price
        if (sort) params.sort = sort

        const res = await api.get('/products', { params })
        const data = res.data.data

        setProducts(data.data || [])
        setTotal(data.total || 0)
        setCurrentPage(data.current_page || 1)
        setLastPage(data.last_page || 1)
      } catch {
        setProducts([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    },
    [debouncedQ, category_id, subcategory_id, condition, min_price, max_price, sort]
  )

  useEffect(() => {
    fetchProducts(1)
  }, [fetchProducts])

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'category_id') next.subcategory_id = ''
      return next
    })
  }

  const clearFilters = () => setFilters(DEFAULT_FILTERS)

  const currentSubcategories = SUBCATEGORIES[category_id] || []

  const activeFilterCount = [
    category_id,
    subcategory_id,
    condition,
    min_price,
    max_price,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-stone-50 font-sans">

      {/* Top search bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              value={q}
              onChange={(e) => updateFilter('q', e.target.value)}
              placeholder="Search for items…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-stone-100 border border-transparent rounded-xl focus:bg-white focus:border-stone-300 focus:outline-none transition-all placeholder:text-stone-400"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="text-sm bg-white border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-stone-400 text-stone-700 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">

        {/* ── Sidebar ── */}
        <aside className="w-52 shrink-0 space-y-6">

          {/* Active filter badge + clear */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-widest uppercase text-stone-500">
                Filters
              </span>
              <button
                onClick={clearFilters}
                className="text-xs text-rose-500 hover:text-rose-700 transition-colors"
              >
                Clear all ({activeFilterCount})
              </button>
            </div>
          )}

          {/* Category */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2.5">
              Category
            </p>
            <div className="space-y-0.5">
              {CATEGORIES.map((cat) => {
                const active = category_id === String(cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      updateFilter('category_id', active ? '' : String(cat.id))
                    }
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      active
                        ? 'bg-stone-900 text-white font-medium'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subcategory */}
          {category_id && currentSubcategories.length > 0 && (
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2.5">
                Type
              </p>
              <div className="space-y-0.5">
                {currentSubcategories.map((sub) => {
                  const active = subcategory_id === sub
                  return (
                    <button
                      key={sub}
                      onClick={() =>
                        updateFilter('subcategory_id', active ? '' : sub)
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        active
                          ? 'bg-amber-100 text-amber-900 font-medium'
                          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                      }`}
                    >
                      {sub}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Condition */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2.5">
              Condition
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CONDITIONS.map((c) => {
                const active = condition === c
                return (
                  <button
                    key={c}
                    onClick={() => updateFilter('condition', active ? '' : c)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      active
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700'
                    }`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Price range */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-2.5">
              Price (৳)
            </p>
            <div className="flex items-center gap-2">
              <input
                value={min_price}
                onChange={(e) => updateFilter('min_price', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Min"
                type="text"
                inputMode="numeric"
                className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-stone-400 bg-white text-stone-700 placeholder:text-stone-300"
              />
              <span className="text-stone-300 text-sm shrink-0">–</span>
              <input
                value={max_price}
                onChange={(e) => updateFilter('max_price', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Max"
                type="text"
                inputMode="numeric"
                className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-stone-400 bg-white text-stone-700 placeholder:text-stone-300"
              />
            </div>
          </div>
        </aside>

        {/* ── Results ── */}
        <div className="flex-1 min-w-0">

          {/* Result count */}
          {!loading && (
            <p className="text-sm text-stone-400 mb-5">
              {total > 0 ? (
                <>
                  Showing{' '}
                  <span className="font-medium text-stone-700">{total}</span>{' '}
                  {total === 1 ? 'item' : 'items'}
                </>
              ) : null}
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-stone-100 rounded-2xl aspect-[3/4] animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-stone-400"
                >
                  <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M15.5 15.5L20 20"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 10h6M10 7v6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-stone-700 font-medium mb-1">No results found</p>
              <p className="text-stone-400 text-sm max-w-xs">
                Try adjusting your filters or searching for something different.
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm text-stone-600 underline underline-offset-2 hover:text-stone-900"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.product_id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {lastPage > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-10">
                  <button
                    onClick={() => fetchProducts(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M9 11L5 7l4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {Array.from({ length: lastPage }).map((_, i) => {
                    const page = i + 1
                    const isActive = page === currentPage
                    const showPage =
                      page === 1 ||
                      page === lastPage ||
                      Math.abs(page - currentPage) <= 1

                    if (!showPage) {
                      if (page === 2 || page === lastPage - 1) {
                        return (
                          <span key={page} className="text-stone-300 text-sm px-1">
                            …
                          </span>
                        )
                      }
                      return null
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => fetchProducts(page)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all ${
                          isActive
                            ? 'bg-stone-900 text-white font-medium'
                            : 'border border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => fetchProducts(currentPage + 1)}
                    disabled={currentPage === lastPage}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M5 3l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-stone-600 animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
