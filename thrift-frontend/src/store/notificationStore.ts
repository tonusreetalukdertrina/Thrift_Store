import { create } from 'zustand'
import api from '@/lib/api'

interface NotifState {
  unreadCount: number
  fetchUnreadCount: () => Promise<void>
}

export const useNotificationStore = create<NotifState>((set) => ({
  unreadCount: 0,

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get('/notifications')
      set({ unreadCount: data.data.unread_count ?? 0 })
    } catch {
      // silently fail
    }
  },
}))
