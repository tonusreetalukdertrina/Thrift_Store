'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Package, User, LogOut, LayoutDashboard, Shield } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { unreadCount, fetchUnreadCount } = useNotificationStore()

  useEffect(() => {
    if (user) fetchUnreadCount()
  }, [user, fetchUnreadCount])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            T
          </div>
          ThriftStore
        </Link>

        <nav className="flex items-center gap-1">
          {user?.role === 'admin' && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <Shield className="w-4 h-4 mr-1" />
                Admin
              </Button>
            </Link>
          )}

          {user ? (
            <>
              <Link href="/search"><Button variant="ghost" size="sm">Browse</Button></Link>

              <Link href="/notifications" className="relative">
                <Button variant="ghost" size="icon">
                  <Bell className="w-4 h-4" />
                </Button>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center pointer-events-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent size-8 hover:bg-muted hover:text-foreground cursor-pointer">
                  <User className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard/seller'}>
                    <Package className="w-4 h-4 mr-2" />
                    My Listings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard/buyer'}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    My Interests
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/search"><Button variant="ghost" size="sm">Browse</Button></Link>
              <Link href="/auth/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/auth/register"><Button size="sm">Get started</Button></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
