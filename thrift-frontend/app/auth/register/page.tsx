'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const router      = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm]   = useState({ name: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const res = await api.post('/auth/register', form)
      const { user, token } = res.data.data
      setAuth(user, token)
      router.replace('/')
    } catch (err: any) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {})
      else setErrors({ general: [err.response?.data?.meta?.message || 'Registration failed'] })
    } finally {
      setLoading(false)
    }
  }

  const field = (name: keyof typeof form) => ({
    value:    form[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [name]: e.target.value })
      setErrors({ ...errors, [name]: [] })
    },
  })

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width:48, height:48, background:'var(--brand)',
            borderRadius:'var(--radius-lg)', display:'flex',
            alignItems:'center', justifyContent:'center',
            color:'#fff', fontSize:24, fontWeight:700, margin:'0 auto 16px',
          }}>T</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>
            Create account
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Join the ThriftStore community</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {errors.general && (
            <div role="alert" style={{
              padding:'10px 14px', background:'var(--danger-bg)',
              border:'1px solid var(--danger-border)', borderRadius:'var(--radius-md)',
              fontSize:13, color:'var(--danger)', marginBottom:20,
              display:'flex', gap:8, alignItems:'center',
            }}>
              <span aria-hidden="true" style={{ fontWeight:700 }}>✕</span>
              {errors.general[0]}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {([
              { id:'name',     label:'Full name',    type:'text',     placeholder:'Your name',           autoComplete:'name'     },
              { id:'email',    label:'Email address',type:'email',    placeholder:'you@example.com',     autoComplete:'email'    },
              { id:'phone',    label:'Phone number', type:'tel',      placeholder:'+8801XXXXXXXXX',      autoComplete:'tel'      },
              { id:'password', label:'Password',     type:'password', placeholder:'Min 8 chars, mix of upper, lower, number, symbol', autoComplete:'new-password' },
            ] as const).map(({ id, label, type, placeholder, autoComplete }) => (
              <div key={id}>
                <label className="label" htmlFor={id}>{label}</label>
                <input
                  id={id}
                  className="input"
                  type={type}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  required
                  {...field(id)}
                />
                {errors[id] && (
                  <p role="alert" style={{ fontSize:12, color:'var(--danger)', marginTop:4, display:'flex', gap:4 }}>
                    <span aria-hidden="true">▲</span>{errors[id][0]}
                  </p>
                )}
              </div>
            ))}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width:'100%', marginTop:4, padding:'12px' }}
            >
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                  <span className="spinner" style={{ width:16, height:16 }} aria-hidden="true" />
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', fontSize:13, color:'var(--text-muted)', marginTop:20 }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color:'var(--brand)', fontWeight:500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}