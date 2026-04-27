'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const router      = useRouter()
  const { setAuth } = useAuthStore()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [triedSubmit, setTriedSubmit] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    // Only clear error after user has tried to submit and starts typing again
    if (triedSubmit && e.target.value.length > 0) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTriedSubmit(true)

    try {
      const res = await api.post('/auth/login', form)
      const { user, token } = res.data.data
      setAuth(user, token)
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/dashboard/buyer')
    } catch (err: any) {
      const status = err.response?.status
      const msg    = err.response?.data?.meta?.message

      let errorMessage = ''
      if (status === 401) {
        errorMessage = 'Incorrect email or password. Please try again.'
      } else if (status === 403) {
        errorMessage = 'Your account has been blocked. Please contact support.'
      } else if (status === 422) {
        errorMessage = 'Please enter a valid email address and password.'
      } else if (!err.response) {
        errorMessage = 'Cannot connect to server. Make sure the backend is running.'
      } else {
        errorMessage = msg || 'Login failed. Please try again.'
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px 20px',
      background:     'var(--bg-base)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo + heading */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width:          48,
            height:         48,
            background:     'var(--brand)',
            borderRadius:   'var(--radius-lg)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          '#fff',
            fontSize:       24,
            fontWeight:     700,
            margin:         '0 auto 16px',
          }}>T</div>
          <h1 style={{
            fontSize:     24,
            fontWeight:   700,
            letterSpacing:'-0.03em',
            marginBottom: 6,
            color:        'var(--text-primary)',
          }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Sign in to your ThriftStore account
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28 }}>

          {/* Error message — persists until user starts typing */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                padding:      '12px 14px',
                background:   '#fef2f2',
                border:       '1px solid #fca5a5',
                borderRadius: '8px',
                fontSize:     13,
                color:        '#b91c1c',
                marginBottom: 20,
                display:      'flex',
                gap:          10,
                alignItems:   'flex-start',
                lineHeight:   1.5,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontWeight:  700,
                  flexShrink:  0,
                  marginTop:   1,
                  fontSize:    14,
                }}
              >
                ✕
              </span>
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <label
                htmlFor="email"
                style={{
                  display:      'block',
                  fontSize:     13,
                  fontWeight:   500,
                  color:        'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                style={{
                  display:      'block',
                  fontSize:     13,
                  fontWeight:   500,
                  color:        'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="Your password"
                required
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width:          '100%',
                padding:        '12px',
                marginTop:      4,
                background:     loading ? 'var(--brand-subtle)' : 'var(--brand)',
                color:          '#fff',
                border:         'none',
                borderRadius:   'var(--radius-md)',
                fontSize:       14,
                fontWeight:     600,
                cursor:         loading ? 'not-allowed' : 'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            8,
                transition:     'background var(--transition)',
              }}
            >
              {loading ? (
                <>
                  <span
                    className="spinner"
                    style={{ width: 16, height: 16 }}
                    aria-hidden="true"
                  />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign:  'center',
          fontSize:   13,
          color:      'var(--text-muted)',
          marginTop:  20,
        }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/register"
            style={{ color: 'var(--brand)', fontWeight: 500, textDecoration: 'none' }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}