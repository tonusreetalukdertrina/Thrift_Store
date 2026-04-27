'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Cookies from 'js-cookie'

interface Props {
  children: React.ReactNode
  adminOnly?: boolean
}

type Status = 'loading' | 'authorized' | 'unauthorized'

export default function AuthGuard({ children, adminOnly = false }: Props) {
  const router            = useRouter()
  const { hydrate }       = useAuthStore()
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    // Read cookies directly — synchronous, no async, no timing issues
    const token    = Cookies.get('token')
    const userJson = Cookies.get('auth_user')

    if (!token || !userJson) {
      setStatus('unauthorized')
      router.replace('/auth/login')
      return
    }

    try {
      const user = JSON.parse(userJson)

      if (adminOnly && user.role !== 'admin') {
        setStatus('unauthorized')
        router.replace('/')
        return
      }

      // Sync Zustand store with cookie data
      hydrate()
      setStatus('authorized')
    } catch (_) {
      // Corrupt cookie — clear and redirect
      Cookies.remove('token')
      Cookies.remove('auth_user')
      setStatus('unauthorized')
      router.replace('/auth/login')
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}