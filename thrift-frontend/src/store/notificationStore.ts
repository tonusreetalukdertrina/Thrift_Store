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
      const { data } = await api.get('/notifications?per_page=1')
      set({ unreadCount: data.data.unread_count ?? 0 })
    } catch {
      // silently fail
    }
  },
}))
