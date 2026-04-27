import { create } from 'zustand'
import Cookies from 'js-cookie'

interface CartItem {
  product_id:  string
  title:       string
  price:       number
  image:       string
  seller_id:   string
  condition:   string
}

interface CartState {
  items:      CartItem[]
  addItem:    (item: CartItem) => void
  removeItem: (productId: string) => void
  clearCart:  () => void
  hasItem:    (productId: string) => boolean
  total:      () => number
  loadCart:   () => void
  saveCart:   (items: CartItem[]) => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  loadCart: () => {
    try {
      const saved = localStorage.getItem('cart')
      if (saved) set({ items: JSON.parse(saved) })
    } catch (_) {}
  },

  saveCart: (items) => {
    try {
      localStorage.setItem('cart', JSON.stringify(items))
    } catch (_) {}
  },

  addItem: (item) => {
    const { items, saveCart } = get()
    if (items.find((i) => i.product_id === item.product_id)) return
    const newItems = [...items, item]
    saveCart(newItems)
    set({ items: newItems })
  },

  removeItem: (productId) => {
    const { items, saveCart } = get()
    const newItems = items.filter((i) => i.product_id !== productId)
    saveCart(newItems)
    set({ items: newItems })
  },

  clearCart: () => {
    localStorage.removeItem('cart')
    set({ items: [] })
  },

  hasItem: (productId) => {
    return get().items.some((i) => i.product_id === productId)
  },

  total: () => {
    return get().items.reduce((sum, item) => sum + item.price, 0)
  },
}))