'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import ProductCard from '@/components/ProductCard'

const CATEGORIES = [
  { id: 1, name: 'Second-hand Clothes', icon: '◎', desc: 'Pre-loved fashion' },
  { id: 2, name: 'Second-hand Books',   icon: '◻', desc: 'Used books'        },
  { id: 3, name: 'Arts & Crafts',       icon: '◈', desc: 'Handmade goods'    },
]

export default function HomePage() {
  const router = useRouter()
  const [q, setQ]           = useState('')
  const [featured, setFeatured] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/products', { params: { sort: 'newest' } })
      .then((res) => {
        const items = res.data.data?.data || res.data.data || []
        setFeatured(Array.isArray(items) ? items.slice(0, 8) : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-enter">
      {/* Hero */}
      <section style={{
        background:   'var(--brand)',
        padding:      '64px 20px',
        textAlign:    'center',
      }}>
        <div className="page">
          <p style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          6,
            fontSize:     12,
            fontWeight:   600,
            color:        'rgba(255,255,255,0.7)',
            letterSpacing:'0.08em',
            textTransform:'uppercase',
            marginBottom: 16,
            border:       '1px solid rgba(255,255,255,0.2)',
            padding:      '4px 12px',
            borderRadius: 'var(--radius-full)',
          }}>
            <span aria-hidden="true">●</span> Sustainable Commerce
          </p>
          <h1 style={{
            fontSize:     '2.8rem',
            fontWeight:   700,
            color:        '#fff',
            letterSpacing:'-0.04em',
            lineHeight:   1.1,
            marginBottom: 16,
            maxWidth:     600,
            margin:       '0 auto 16px',
          }}>
            Buy & sell second-hand goods
          </h1>
          <p style={{ color:'rgba(255,255,255,0.75)', fontSize:16, marginBottom:32, maxWidth:480, margin:'0 auto 32px' }}>
            Clothes, books, and artisan crafts — affordable, sustainable, community-driven.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/search?q=${encodeURIComponent(q)}`) }}
            style={{ display:'flex', gap:8, maxWidth:520, margin:'0 auto' }}
            role="search"
          >
            <label htmlFor="hero-search" style={{ position:'absolute', width:1, height:1, overflow:'hidden' }}>
              Search listings
            </label>
            <input
              id="hero-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clothes, books, crafts…"
              style={{
                flex:         1,
                background:   'rgba(255,255,255,0.15)',
                border:       '1px solid rgba(255,255,255,0.3)',
                borderRadius: 'var(--radius-md)',
                padding:      '12px 16px',
                color:        '#fff',
                fontSize:     14,
                outline:      'none',
                backdropFilter:'blur(8px)',
              }}
            />
            <button type="submit" className="btn" style={{
              background:   '#fff',
              color:        'var(--brand)',
              fontWeight:   700,
              padding:      '12px 24px',
              borderRadius: 'var(--radius-md)',
              flexShrink:   0,
            }}>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '48px 0 0' }}>
        <div className="page">
          <h2 style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em', marginBottom:20 }}>
            Browse by category
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category_id=${cat.id}`}
                style={{ textDecoration:'none' }}
              >
                <div
                  className="card"
                  style={{
                    padding:    '20px 20px',
                    display:    'flex',
                    alignItems: 'center',
                    gap:        14,
                    transition: 'all var(--transition)',
                    cursor:     'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand)'
                    e.currentTarget.style.boxShadow   = 'var(--shadow-md)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow   = 'var(--shadow-sm)'
                  }}
                >
                  <div style={{
                    width:          44,
                    height:         44,
                    borderRadius:   'var(--radius-md)',
                    background:     'var(--brand-light)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontSize:       20,
                    color:          'var(--brand)',
                    flexShrink:     0,
                  }} aria-hidden="true">
                    {cat.icon}
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{cat.name}</p>
                    <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{cat.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section style={{ padding:'48px 0 64px' }}>
        <div className="page">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <h2 style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.02em' }}>Latest listings</h2>
            <Link href="/search" style={{ fontSize:13, color:'var(--brand)', fontWeight:500, textDecoration:'none' }}>
              View all →
            </Link>
          </div>

          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 260 }} aria-hidden="true" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'64px 24px' }}>
              <p style={{ fontSize:40, marginBottom:16, color:'var(--text-muted)' }} aria-hidden="true">◻</p>
              <p style={{ fontSize:15, fontWeight:500, color:'var(--text-secondary)', marginBottom:8 }}>No listings yet</p>
              <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>Be the first to sell something!</p>
              <Link href="/listings/create" className="btn btn-primary btn-sm">Create a listing</Link>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16 }}>
              {featured.map((p) => <ProductCard key={p.product_id} product={p} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}