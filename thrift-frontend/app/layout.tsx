'use client'

import { Inter }     from 'next/font/google'
import './globals.css'
import Navbar        from '@/components/Navbar'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate)
  useEffect(() => { hydrate() }, [])

  return (
    <html lang="en">
      <body suppressHydrationWarning style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}