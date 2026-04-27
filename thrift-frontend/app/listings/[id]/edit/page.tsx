'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import AuthGuard from '@/components/AuthGuard'
import Cookies from 'js-cookie'

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']
const API_BASE   = 'http://127.0.0.1:8000'

export default function EditListingPage() {
  return (
    <AuthGuard>
      <EditListingContent />
    </AuthGuard>
  )
}

function EditListingContent() {
  const { id }   = useParams()
  const router   = useRouter()
  const { user } = useAuthStore()

  const [loading, setSaving]  = useState(false)
  const [fetching, setFetching] = useState(true)
  const [errors, setErrors]   = useState<Record<string, string[]>>({})
  const [success, setSuccess] = useState('')
  const [categories, setCategories]     = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])

  const fetchedRef = useRef(false)

  const [form, setForm] = useState({
    title:          '',
    description:    '',
    price:          '',
    condition:      'Good',
    category_id:    '',
    subcategory_id: '',
    location:       '',
  })

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    Promise.all([
      api.get(`/products/${id}`),
      api.get('/categories'),
    ]).then(([productRes, catRes]) => {
      const p = productRes.data.data

      // Verify ownership
      if (p.seller_id !== user?.user_id) {
        router.replace('/')
        return
      }

      setForm({
        title:          p.title          || '',
        description:    p.description    || '',
        price:          String(p.price)  || '',
        condition:      p.condition      || 'Good',
        category_id:    String(p.category_id) || '',
        subcategory_id: String(p.subcategory_id || '') || '',
        location:       p.location       || '',
      })

      const cats = catRes.data.data || []
      setCategories(cats)

      // Set subcategories for current category
      const cat = cats.find((c: any) => String(c.category_id) === String(p.category_id))
      setSubcategories(cat?.subcategories || [])
    }).catch(() => router.replace('/dashboard/seller'))
      .finally(() => setFetching(false))
  }, [])

  useEffect(() => {
    if (!form.category_id || categories.length === 0) return
    const cat = categories.find((c: any) => String(c.category_id) === form.category_id)
    setSubcategories(cat?.subcategories || [])
  }, [form.category_id, categories])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'category_id') next.subcategory_id = ''
      return next
    })
    setErrors({ ...errors, [name]: [] })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess('')

    const newErrors: Record<string, string[]> = {}
    if (!form.title || form.title.length < 5)
      newErrors.title = ['Title must be at least 5 characters']
    if (!form.description || form.description.length < 20)
      newErrors.description = ['Description must be at least 20 characters']
    if (!form.price || parseFloat(form.price) <= 0)
      newErrors.price = ['Enter a valid price']
    if (!form.category_id)
      newErrors.category_id = ['Select a category']
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setSaving(true)
    try {
      await api.put(`/products/${id}`, {
        title:          form.title,
        description:    form.description,
        price:          parseFloat(form.price),
        condition:      form.condition,
        category_id:    parseInt(form.category_id),
        subcategory_id: form.subcategory_id ? parseInt(form.subcategory_id) : null,
        location:       form.location,
      })
      setSuccess('Listing updated successfully!')
      setTimeout(() => router.push('/dashboard/seller'), 1500)
    } catch (err: any) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else {
        setErrors({ general: [err.response?.data?.meta?.message || 'Update failed'] })
      }
    } finally {
      setSaving(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit listing</h1>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {success}
        </div>
      )}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errors.general[0]}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            minLength={5}
            maxLength={120}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            minLength={20}
            maxLength={2000}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {categories.map((cat: any) => (
              <option key={cat.category_id} value={String(cat.category_id)}>
                {cat.category_name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id[0]}</p>}
        </div>

        {subcategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcategory <span className="text-gray-400">(optional)</span>
            </label>
            <select
              name="subcategory_id"
              value={form.subcategory_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a subcategory</option>
              {subcategories.map((sub: any) => (
                <option key={sub.subcategory_id} value={String(sub.subcategory_id)}>
                  {sub.subcategory_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location <span className="text-gray-400">(optional)</span>
          </label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g. Dhaka, Mirpur"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}