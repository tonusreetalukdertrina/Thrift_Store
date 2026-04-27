import { create } from 'zustand'
import Cookies from 'js-cookie'

interface User {
  user_id: string
  name: string
  email: string
  phone: string
  role: string
  profile_photo_url: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  hydrate: () => void
  setAuth: (user: User, token: string) => void
  logout: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:  null,
  token: null,

  // Read from cookies into Zustand — call this once on mount
  hydrate: () => {
    const token    = Cookies.get('token') || null
    const userJson = Cookies.get('auth_user') || null

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson)
        set({ user, token })
        return
      } catch (_) {
        Cookies.remove('token')
        Cookies.remove('auth_user')
      }
    }
    set({ user: null, token: null })
  },

  setAuth: (user, token) => {
    Cookies.set('token', token,                    { expires: 1, sameSite: 'lax' })
    Cookies.set('auth_user', JSON.stringify(user), { expires: 1, sameSite: 'lax' })
    set({ user, token })
  },

  logout: () => {
    Cookies.remove('token')
    Cookies.remove('auth_user')
    set({ user: null, token: null })
  },

  isAdmin: () => get().user?.role === 'admin',
}))