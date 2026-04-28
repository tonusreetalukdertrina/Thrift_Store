'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Bell,
  Package,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
  Search,
  PlusCircle,
  Menu,
  X,
  Home,
  ShoppingBag,
  ExternalLink,
  CheckCheck,
} from 'lucide-react'
import type { Notification } from '@/lib/types'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { unreadCount, fetchUnreadCount } = useNotificationStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([])
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (user) fetchUnreadCount()
  }, [user, fetchUnreadCount])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const fetchRecent = async () => {
    if (!user) return
    try {
      const { data } = await api.get('/notifications')
      setRecentNotifs(data.data.notifications?.data?.slice(0, 5) || [])
    } catch {}
  }

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`)
    fetchUnreadCount()
    fetchRecent()
  }

  const markAllRead = async () => {
    await api.patch('/notifications/read-all')
    fetchUnreadCount()
    fetchRecent()
  }

  const dashboardLink = isAdmin ? '/admin' : '/dashboard/seller'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-lg shadow-sm">
      <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm">
            T
          </div>
          <span className="hidden sm:inline">ThriftStore</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>

          <Link href="/search">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Search className="w-4 h-4" />
              Browse
            </Button>
          </Link>

          {user && !isAdmin && (
            <Link href="/listings/create">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <PlusCircle className="w-4 h-4" />
                List Item
              </Button>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <DropdownMenu open={notifOpen} onOpenChange={(open) => { setNotifOpen(open); if (open) fetchRecent() }}>
                <DropdownMenuTrigger className="relative hidden sm:inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center pointer-events-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between px-3 py-2">
                    <p className="text-sm font-semibold">Notifications</p>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {recentNotifs.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No notifications
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {recentNotifs.map((n) => (
                        <DropdownMenuItem
                          key={n.notification_id}
                          className={`flex flex-col items-start gap-1 px-3 py-3 cursor-pointer ${
                            n.status === 'unread' ? 'bg-accent/50' : ''
                          }`}
                          onClick={() => n.status === 'unread' && markRead(n.notification_id)}
                        >
                          <p className="text-sm line-clamp-2">{n.body}</p>
                          <div className="flex items-center gap-2 w-full">
                            <span className="text-xs text-muted-foreground">
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                            {n.status === 'unread' && (
                              <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2">
                    <Link href="/notifications" className="flex items-center justify-center gap-1 text-xs text-primary hover:underline w-full">
                      View all notifications
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border size-9 hover:bg-muted hover:text-foreground cursor-pointer transition-colors">
                  <User className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = dashboardLink}>
                    {isAdmin ? <Shield className="w-4 h-4 mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                    {isAdmin ? 'Admin Panel' : 'My Listings'}
                  </DropdownMenuItem>
                  {!isAdmin && (
                    <DropdownMenuItem onClick={() => window.location.href = '/dashboard/buyer'}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      My Interests
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-1">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-background">
          <div className="flex flex-col p-4 space-y-2">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>

            <Link href="/search" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Search className="w-4 h-4" />
                Browse Listings
              </Button>
            </Link>

            {user && !isAdmin && (
              <Link href="/listings/create" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <PlusCircle className="w-4 h-4" />
                  List an Item
                </Button>
              </Link>
            )}

            {user && (
              <Link href="/notifications" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2 relative">
                  <Bell className="w-4 h-4" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {user ? (
              <>
                <div className="border-t pt-2 mt-2 space-y-1">
                  <Link href={dashboardLink} onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      {isAdmin ? <Shield className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                      {isAdmin ? 'Admin Panel' : 'My Listings'}
                    </Button>
                  </Link>
                  {!isAdmin && (
                    <Link href="/dashboard/buyer" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        My Interests
                      </Button>
                    </Link>
                  )}
                  <Link href="/profile" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </Button>
                  </Link>
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="px-3 py-2 mb-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    onClick={() => { logout(); setMobileOpen(false) }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </Button>
                </div>
              </>
            ) : (
              <div className="border-t pt-4 mt-4 space-y-2">
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Sign in</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Get started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
