'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { Notification } from '@/lib/types'
import AuthGuard from '@/components/layout/AuthGuard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/notifications')
      const notifData = data.data
      setNotifications(notifData.notifications?.data || [])
      setUnreadCount(notifData.unread_count || 0)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifs() }, [])

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`)
    fetchNotifs()
  }

  const markAllRead = async () => {
    await api.patch('/notifications/read-all')
    toast.success('All marked as read')
    fetchNotifs()
  }

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.notification_id}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${n.status === 'unread' ? 'bg-accent border-accent' : 'bg-card'}`}
                onClick={() => n.status === 'unread' && markRead(n.notification_id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    {n.subject && (
                      <p className="font-medium text-sm">{n.subject}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                  </div>
                  {n.status === 'unread' && (
                    <Badge variant="default" className="shrink-0 text-[10px] h-5">New</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(n.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
