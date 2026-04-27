'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import api from '@/lib/api'
import Cookies from 'js-cookie'

export default function Navbar() {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, logout, hydrate } = useAuthStore()
  const { items: cartItems, loadCart } = useCartStore()

  const [menuOpen, setMenuOpen]   = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)

  const menuRef  = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => { hydrate(); loadCart() }, [])

  useEffect(() => {
    if (!user?.user_id) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    fetchNotifications()
    const t = setInterval(fetchNotifications, 30000)
    return () => clearInterval(t)
  }, [user?.user_id])

  const fetchNotifications = async () => {
    if (!Cookies.get('token')) return
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.data.notifications?.data || [])
      setUnreadCount(res.data.data.unread_count || 0)
    } catch (_) {}
  }

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {})
    setUnreadCount(0)
    setNotifications((n) => n.map((x) => ({ ...x, status: 'read' })))
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current  && !menuRef.current.contains(e.target as Node))  setMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setMenuOpen(false)
    try { await api.post('/auth/logout') } catch (_) {}
    logout()
    router.push('/auth/login')
  }

  const isActive = (href: string) => pathname === href

  const NOTIF_ICONS: Record<string, string> = {
    new_order:            '🛍',
    order_confirmed:      '✅',
    order_status_dispatched: '🚚',
    order_status_completed:  '🎉',
    order_cancelled:      '✕',
    listing_published:    '📢',
    listing_expiring_soon:'⏰',
    listing_archived:     '📦',
    listing_removed:      '✕',
    new_review:           '★',
    new_message:          '✉',
    account_blocked:      '🔒',
    report_resolved:      '🚩',
  }

  return (
    <header style={{
      position:     'sticky',
      top:          0,
      zIndex:       100,
      background:   'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      boxShadow:    'var(--shadow-sm)',
    }}>
      <div className="page" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width:        32,
            height:       32,
            background:   'var(--brand)',
            borderRadius: 'var(--radius-md)',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            color:        '#fff',
            fontSize:     16,
            fontWeight:   700,
          }}>
            T
          </div>
          <span style={{
            fontWeight: 700,
            fontSize:   17,
            color:      'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            ThriftStore
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavLink href="/search" active={isActive('/search')}>Browse</NavLink>
          {user && user.role !== 'admin' && (
            <NavLink href="/listings/create" active={isActive('/listings/create')}>Sell</NavLink>
          )}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

          {user ? (
            <>
              {/* Cart */}
              {user.role !== 'admin' && (
                <Link
                  href="/cart"
                  style={{
                    position:      'relative',
                    width:         36,
                    height:        36,
                    display:       'flex',
                    alignItems:    'center',
                    justifyContent:'center',
                    borderRadius:  'var(--radius-md)',
                    color:         'var(--text-secondary)',
                    textDecoration:'none',
                    background:    isActive('/cart') ? 'var(--brand-light)' : 'transparent',
                    transition:    'background var(--transition)',
                  }}
                  aria-label={`Cart, ${cartItems.length} items`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  {cartItems.length > 0 && (
                    <span style={{
                      position:      'absolute',
                      top:           2,
                      right:         2,
                      width:         16,
                      height:        16,
                      background:    'var(--brand)',
                      color:         '#fff',
                      borderRadius:  '50%',
                      fontSize:      10,
                      fontWeight:    700,
                      display:       'flex',
                      alignItems:    'center',
                      justifyContent:'center',
                    }} aria-hidden="true">
                      {cartItems.length}
                    </span>
                  )}
                </Link>
              )}

              {/* Notifications */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false) }}
                  style={{
                    width:          36,
                    height:         36,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    borderRadius:   'var(--radius-md)',
                    background:     notifOpen ? 'var(--brand-light)' : 'transparent',
                    border:         'none',
                    cursor:         'pointer',
                    color:          'var(--text-secondary)',
                    position:       'relative',
                    transition:     'background var(--transition)',
                  }}
                  aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span style={{
                      position:      'absolute',
                      top:           4,
                      right:         4,
                      width:         8,
                      height:        8,
                      background:    'var(--danger)',
                      borderRadius:  '50%',
                      border:        '2px solid var(--bg-card)',
                    }} aria-hidden="true" />
                  )}
                </button>

                {notifOpen && (
                  <div style={{
                    position:     'absolute',
                    right:        0,
                    top:          'calc(100% + 8px)',
                    width:        340,
                    background:   'var(--bg-card)',
                    border:       '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow:    'var(--shadow-lg)',
                    overflow:     'hidden',
                    zIndex:       200,
                  }}>
                    <div style={{
                      display:        'flex',
                      justifyContent: 'space-between',
                      alignItems:     'center',
                      padding:        '14px 16px',
                      borderBottom:   '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          style={{ fontSize: 12, color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                          No notifications yet
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.notification_id}
                            style={{
                              display:    'flex',
                              gap:        12,
                              padding:    '12px 16px',
                              borderBottom: '1px solid var(--border)',
                              background: n.status === 'unread' ? 'var(--brand-light)' : 'transparent',
                              cursor:     'pointer',
                              transition: 'background var(--transition)',
                            }}
                            onClick={() => {
                              if (n.status === 'unread') {
                                api.patch(`/notifications/${n.notification_id}/read`).catch(() => {})
                                setUnreadCount((c) => Math.max(0, c - 1))
                                setNotifications((prev) => prev.map((x) =>
                                  x.notification_id === n.notification_id ? { ...x, status: 'read' } : x
                                ))
                              }
                            }}
                          >
                            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} aria-hidden="true">
                              {NOTIF_ICONS[n.type] || '•'}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.body}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                {new Date(n.created_at).toLocaleString()}
                              </p>
                            </div>
                            {n.status === 'unread' && (
                              <div style={{
                                width: 7, height: 7,
                                background: 'var(--brand)',
                                borderRadius: '50%',
                                flexShrink: 0,
                                marginTop: 5,
                              }} aria-hidden="true" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button
                  onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false) }}
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            8,
                    padding:        '4px 10px 4px 4px',
                    background:     menuOpen ? 'var(--bg-card-alt)' : 'transparent',
                    border:         '1px solid var(--border)',
                    borderRadius:   'var(--radius-full)',
                    cursor:         'pointer',
                    transition:     'background var(--transition)',
                  }}
                  aria-expanded={menuOpen}
                  aria-label="User menu"
                >
                  <div style={{
                    width:          28,
                    height:         28,
                    borderRadius:   '50%',
                    background:     'var(--brand)',
                    color:          '#fff',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontSize:       12,
                    fontWeight:     700,
                    flexShrink:     0,
                  }} aria-hidden="true">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name.split(' ')[0]}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {menuOpen && (
                  <div style={{
                    position:     'absolute',
                    right:        0,
                    top:          'calc(100% + 8px)',
                    width:        220,
                    background:   'var(--bg-card)',
                    border:       '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow:    'var(--shadow-lg)',
                    overflow:     'hidden',
                    zIndex:       200,
                  }}>
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{user.email}</p>
                      <span className={`badge ${user.role === 'admin' ? 'badge-info' : 'badge-success'}`} style={{ marginTop: 6 }}>
                        {user.role}
                      </span>
                    </div>

                    <div style={{ padding: '4px' }}>
                      <MenuItem href="/profile" icon="○" onClick={() => setMenuOpen(false)}>Account settings</MenuItem>
                      {user.role === 'admin' ? (
                        <>
                          <MenuItem href="/admin/dashboard"  icon="▦" onClick={() => setMenuOpen(false)}>Admin dashboard</MenuItem>
                          <MenuItem href="/admin/users"      icon="◎" onClick={() => setMenuOpen(false)}>Manage users</MenuItem>
                          <MenuItem href="/admin/listings"   icon="◻" onClick={() => setMenuOpen(false)}>Manage listings</MenuItem>
                          <MenuItem href="/admin/reports"    icon="⚑" onClick={() => setMenuOpen(false)}>Flagged content</MenuItem>
                          <MenuItem href="/admin/payments"   icon="◈" onClick={() => setMenuOpen(false)}>Transactions</MenuItem>
                        </>
                      ) : (
                        <>
                          <MenuItem href="/dashboard/buyer"  icon="◎" onClick={() => setMenuOpen(false)}>My orders</MenuItem>
                          <MenuItem href="/dashboard/seller" icon="◻" onClick={() => setMenuOpen(false)}>Seller dashboard</MenuItem>
                          <MenuItem href="/listings/create"  icon="+" onClick={() => setMenuOpen(false)}>Create listing</MenuItem>
                        </>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', padding: '4px' }}>
                      <button
                        onClick={handleLogout}
                        style={{
                          width:       '100%',
                          textAlign:   'left',
                          padding:     '8px 10px',
                          borderRadius:'var(--radius-md)',
                          fontSize:    13,
                          color:       'var(--danger)',
                          background:  'transparent',
                          border:      'none',
                          cursor:      'pointer',
                          display:     'flex',
                          alignItems:  'center',
                          gap:         8,
                          transition:  'background var(--transition)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span aria-hidden="true">→</span> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login"    className="btn btn-ghost btn-sm">Sign in</Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding:       '6px 12px',
        borderRadius:  'var(--radius-md)',
        fontSize:      14,
        fontWeight:    active ? 600 : 400,
        color:         active ? 'var(--brand)' : 'var(--text-secondary)',
        background:    active ? 'var(--brand-light)' : 'transparent',
        textDecoration:'none',
        transition:    'all var(--transition)',
      }}
    >
      {children}
    </Link>
  )
}

function MenuItem({ href, icon, onClick, children }: { href: string; icon: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          8,
        padding:      '8px 10px',
        borderRadius: 'var(--radius-md)',
        fontSize:     13,
        color:        'var(--text-secondary)',
        textDecoration:'none',
        transition:   'all var(--transition)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-card-alt)'
        e.currentTarget.style.color      = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color      = 'var(--text-secondary)'
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 14, textAlign: 'center', flexShrink: 0 }} aria-hidden="true">
        {icon}
      </span>
      {children}
    </Link>
  )
}