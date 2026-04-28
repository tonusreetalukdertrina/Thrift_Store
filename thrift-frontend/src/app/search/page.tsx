'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import type { Listing, Category, PaginatedData } from '@/lib/types'
import ListingCard from '@/components/listings/ListingCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const [q, setQ] = useState(searchParams.get('q') || '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category_id') || '')
  const [condition, setCondition] = useState(searchParams.get('condition') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')

  const [debouncedQ, setDebouncedQ] = useState(q)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data || [])).catch(() => {})
  }, [])

  const fetchListings = useCallback(
    async (p = 1) => {
      setLoading(true)
      try {
        const params: Record<string, any> = { page: p }
        if (debouncedQ) params.q = debouncedQ
        if (categoryId) params.category_id = categoryId
        if (condition) params.condition = condition
        if (minPrice) params.min_price = minPrice
        if (maxPrice) params.max_price = maxPrice
        if (sort) params.sort = sort

        const { data } = await api.get('/listings', { params })
        const paginated: PaginatedData<Listing> = data.data
        setListings(paginated.data || [])
        setTotal(paginated.total || 0)
        setPage(paginated.current_page || 1)
        setLastPage(paginated.last_page || 1)
      } catch {
        setListings([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    },
    [debouncedQ, categoryId, condition, minPrice, maxPrice, sort],
  )

  useEffect(() => { fetchListings(1) }, [fetchListings])

  const activeFilters = [
    categoryId && categories.find((c) => String(c.category_id) === categoryId)?.category_name,
    condition,
    minPrice && `Min $${minPrice}`,
    maxPrice && `Max $${maxPrice}`,
  ].filter(Boolean) as string[]

  const clearFilters = () => {
    setCategoryId('')
    setCondition('')
    setMinPrice('')
    setMaxPrice('')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-14 z-40 border-b bg-card shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clothes, books, crafts…"
              className="pl-9"
            />
          </div>
          <Select value={sort} onValueChange={(v) => v && setSort(v)}>
            <SelectTrigger className="w-40 hidden sm:flex">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row gap-6">
        <aside className="sm:w-52 shrink-0 space-y-5">
          {activeFilters.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Filters</span>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-destructive" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeFilters.map((f) => (
                  <Badge key={f} variant="secondary" className="text-xs gap-1">
                    {f}
                    <X className="w-3 h-3 cursor-pointer" onClick={clearFilters} />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2.5">Category</p>
            <div className="space-y-0.5">
              <Button
                variant={categoryId ? 'ghost' : 'default'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setCategoryId('')}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.category_id}
                  variant={categoryId === String(cat.category_id) ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setCategoryId(categoryId === String(cat.category_id) ? '' : String(cat.category_id))}
                >
                  {cat.category_name}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2.5">Condition</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant={condition ? 'outline' : 'default'}
                className="cursor-pointer"
                onClick={() => setCondition('')}
              >
                Any
              </Badge>
              {CONDITIONS.map((c) => (
                <Badge
                  key={c}
                  variant={condition === c ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setCondition(condition === c ? '' : c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2.5">Price range</p>
            <div className="flex items-center gap-2">
              <Input
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Min"
                className="h-8 text-sm"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Max"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="sm:hidden">
            <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2.5">Sort by</p>
            <Select value={sort} onValueChange={(v) => v && setSort(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {!loading && total > 0 && (
            <p className="text-sm text-muted-foreground mb-5">
              <span className="font-medium text-foreground">{total}</span>{' '}
              {total === 1 ? 'item' : 'items'} found
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/3" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">No results found</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Try adjusting your filters or searching for something different.
              </p>
              {activeFilters.length > 0 && (
                <Button variant="link" className="mt-4" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {listings.map((l) => (
                  <ListingCard key={l.listing_id} listing={l} />
                ))}
              </div>

              {lastPage > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-10">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === 1}
                    onClick={() => fetchListings(page - 1)}
                  >
                    <span className="sr-only">Previous</span>
                    ←
                  </Button>
                  {Array.from({ length: lastPage }).map((_, i) => {
                    const p = i + 1
                    if (p === 1 || p === lastPage || Math.abs(p - page) <= 1) {
                      return (
                        <Button
                          key={p}
                          variant={p === page ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => fetchListings(p)}
                        >
                          {p}
                        </Button>
                      )
                    }
                    if (p === 2 || p === lastPage - 1) {
                      return <span key={p} className="text-muted-foreground">…</span>
                    }
                    return null
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === lastPage}
                    onClick={() => fetchListings(page + 1)}
                  >
                    <span className="sr-only">Next</span>
                    →
                  </Button>
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
