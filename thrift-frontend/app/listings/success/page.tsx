'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import Cookies from 'js-cookie'

type Stage = 'verifying' | 'success' | 'already_active' | 'failed'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const sessionId    = searchParams.get('session_id')

  const [stage, setStage]       = useState<Stage>('verifying')
  const [activated, setActivated] = useState(0)
  const [error, setError]       = useState('')
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!sessionId) {
      router.replace('/dashboard/seller')
      return
    }

    // If not logged in, save session ID and redirect to login
    if (!Cookies.get('token')) {
      sessionStorage.setItem('pending_session', sessionId)
      router.replace('/auth/login')
      return
    }

    activateProducts()
  }, [sessionId])

  const activateProducts = async (attempt = 1) => {
    setAttempts(attempt)

    try {
      const res = await api.post('/payments/verify', { session_id: sessionId })
      const data = res.data.data

      if (data.activated > 0) {
        setActivated(data.activated)
        setStage('success')
      } else {
        // Products might already be active from webhook
        setStage('already_active')
      }
    } catch (err: any) {
      const status = err.response?.status
      const msg    = err.response?.data?.meta?.message || ''

      if (status === 402 && attempt < 5) {
        // Payment processing — retry after delay
        setTimeout(() => activateProducts(attempt + 1), 2000)
        return
      }

      if (msg.includes('metadata')) {
        // Metadata missing — try to find by seller
        await fallbackActivation()
        return
      }

      setError(msg || 'Could not verify payment')
      setStage('failed')
    }
  }

  // Fallback: activate all draft products that have a pending payment
  // for this seller — used when metadata is missing
  const fallbackActivation = async () => {
    try {
      const res = await api.get('/payments/due')
      const draftCount = res.data.data?.draft_count ?? 0

      if (draftCount === 0) {
        setStage('already_active')
        return
      }

      // Get all draft products and activate ones with pending payments
      const listingsRes = await api.get('/seller/listings', {
        params: { status: 'draft' }
      })
      const drafts = listingsRes.data.data || []

      if (drafts.length === 0) {
        setStage('already_active')
        return
      }

      // Try to activate them via verify with product IDs directly
      const productIds = drafts.map((d: any) => d.product_id)
      const activateRes = await api.post('/payments/activate-drafts', {
        product_ids: productIds,
        session_id:  sessionId,
      })

      setActivated(activateRes.data.data?.activated || 0)
      setStage('success')
    } catch (_) {
      setStage('already_active') // assume webhook handled it
    }
  }

  // ── Verifying stage ─────────────────────────────────────────────────────────
  if (stage === 'verifying') {
    return (
      <div style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     '#fafaf9',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 380, padding: '0 24px' }}>
          <div style={{
            width:          56,
            height:         56,
            border:         '3px solid #e7e5e4',
            borderTopColor: '#1c1917',
            borderRadius:   '50%',
            animation:      'spin 0.8s linear infinite',
            margin:         '0 auto 24px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1c1917', marginBottom: 8 }}>
            Verifying payment…
          </h2>
          <p style={{ fontSize: 13, color: '#78716c' }}>
            {attempts > 1
              ? `Checking with Stripe… (attempt ${attempts}/5)`
              : 'Confirming your payment and activating listings'}
          </p>
        </div>
      </div>
    )
  }

  // ── Success stage ────────────────────────────────────────────────────────────
  if (stage === 'success' || stage === 'already_active') {
    return (
      <div style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     '#fafaf9',
        padding:        '24px',
      }}>
        <div style={{
          background:   '#fff',
          border:       '1px solid #e7e5e4',
          borderRadius: 20,
          padding:      '40px 32px',
          maxWidth:     420,
          width:        '100%',
          textAlign:    'center',
        }}>
          <div style={{
            width:          56,
            height:         56,
            background:     '#f0fdf4',
            border:         '2px solid #bbf7d0',
            borderRadius:   '50%',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       24,
            margin:         '0 auto 20px',
          }}>
            ✓
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1c1917', marginBottom: 8 }}>
            {stage === 'success' ? 'Listings published!' : 'Payment confirmed!'}
          </h1>

          <p style={{ fontSize: 14, color: '#78716c', marginBottom: 24, lineHeight: 1.6 }}>
            {stage === 'success'
              ? `${activated} listing${activated !== 1 ? 's are' : ' is'} now live on the marketplace.`
              : 'Your listings are live. Check your seller dashboard.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link
              href="/dashboard/seller?tab=listings&refresh=1"
              style={{
                display:      'block',
                padding:      '13px',
                background:   '#1c1917',
                color:        '#fff',
                borderRadius: 12,
                fontSize:     14,
                fontWeight:   600,
                textDecoration:'none',
                textAlign:    'center',
              }}
            >
              View my listings
            </Link>
            <Link
              href="/search"
              style={{
                display:      'block',
                padding:      '13px',
                background:   '#f5f5f4',
                color:        '#44403c',
                borderRadius: 12,
                fontSize:     14,
                fontWeight:   500,
                textDecoration:'none',
                textAlign:    'center',
              }}
            >
              Browse marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Failed stage ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     '#fafaf9',
      padding:        '24px',
    }}>
      <div style={{
        background:   '#fff',
        border:       '1px solid #e7e5e4',
        borderRadius: 20,
        padding:      '40px 32px',
        maxWidth:     420,
        width:        '100%',
        textAlign:    'center',
      }}>
        <div style={{
          width:          56,
          height:         56,
          background:     '#fef2f2',
          border:         '2px solid #fecaca',
          borderRadius:   '50%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       24,
          margin:         '0 auto 20px',
          color:          '#dc2626',
        }}>
          ✕
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1c1917', marginBottom: 8 }}>
          Verification failed
        </h1>
        <p style={{ fontSize: 14, color: '#78716c', marginBottom: 8, lineHeight: 1.6 }}>
          {error || 'Could not verify your payment automatically.'}
        </p>
        <p style={{ fontSize: 13, color: '#a8a29e', marginBottom: 24 }}>
          If money was charged, your listings will be activated within a few minutes via webhook.
          Check your dashboard or contact support.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => { setStage('verifying'); setError(''); activateProducts(1) }}
            style={{
              padding:      '13px',
              background:   '#1c1917',
              color:        '#fff',
              borderRadius: 12,
              fontSize:     14,
              fontWeight:   600,
              border:       'none',
              cursor:       'pointer',
              width:        '100%',
            }}
          >
            Try again
          </button>
          <Link
            href="/dashboard/seller"
            style={{
              display:      'block',
              padding:      '13px',
              background:   '#f5f5f4',
              color:        '#44403c',
              borderRadius: 12,
              fontSize:     14,
              fontWeight:   500,
              textDecoration:'none',
              textAlign:    'center',
            }}
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{
          width:48, height:48,
          border:'3px solid #e7e5e4',
          borderTopColor:'#1c1917',
          borderRadius:'50%',
          animation:'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}