'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Cookies from 'js-cookie'

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']
const STEPS = ['Details', 'Images', 'Preview']

export default function CreateListingPage() {
  const router = useRouter()

  const [step, setStep]             = useState(0)
  const [categories, setCategories] = useState<any[]>([])
  const [images, setImages]         = useState<File[]>([])
  const [previews, setPreviews]     = useState<string[]>([])
  const [errors, setErrors]         = useState<Record<string, string[]>>({})
  const [loading, setLoading]       = useState(false)
  const [createdProduct, setCreatedProduct] = useState<any>(null)
  const [subcategories, setSubcategories] = useState<any[]>([])

  const [form, setForm] = useState({
    title:       '',
    description: '',
    price:       '',
    condition:   'Good',
    category_id: '',
    subcategory_id: '',
    location:    '',
  })

  useEffect(() => {
    if (!Cookies.get('token')) {
      router.push('/auth/login')
      return
    }

    api.get('/categories').then((res) => {
    const raw: any[] = res.data.data || []
    const seen = new Set()
    const unique = raw.filter((cat) => {
      if (seen.has(cat.category_id)) return false
      seen.add(cat.category_id)
      return true
    })
    setCategories(unique)
  })
  }, [])

  useEffect(() => {
    if (!form.category_id) {
      setSubcategories([])
      setForm((f) => ({ ...f, subcategory_id: '' }))
      return
    }
    const cat = categories.find(
      (c: any) => String(c.category_id) === form.category_id
    )
    setSubcategories(cat?.subcategories || [])
    setForm((f) => ({ ...f, subcategory_id: '' }))
  }, [form.category_id, categories])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: [] })
  }

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const total = images.length + files.length
    if (total > 5) {
      setErrors({ images: ['Maximum 5 images allowed'] })
      return
    }
    setImages((prev) => [...prev, ...files])
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
    setErrors({ ...errors, images: [] })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleNext = () => {
  if (step === 0) {
    const newErrors: Record<string, string[]> = {}

    if (!form.title || form.title.length < 5)
      newErrors.title = ['Title must be at least 5 characters']

    if (!form.description || form.description.length < 20)
      newErrors.description = ['Description must be at least 20 characters']

    if (!form.price || parseFloat(form.price) <= 0)
      newErrors.price = ['Enter a valid price']

    if (!form.category_id)
      newErrors.category_id = ['Select a category']

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
  }

  if (step === 1) {
    if (images.length < 3) {
      setErrors({ images: ['Upload at least 3 images'] })
      return
    }
  }
  setStep((s) => s + 1)
}

  const handleSubmit = async () => {
    setLoading(true)
    setErrors({})
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      images.forEach((img) => formData.append('images[]', img))

      await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Go to seller dashboard where they can pay for all drafts at once
      router.push('/dashboard/seller?tab=listings')
    } catch (err: any) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors)
        setStep(0)
      } else {
        setErrors({ general: [err.response?.data?.meta?.message || 'Something went wrong'] })
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setLoading(true)
    try {
      const res = await api.get(
        `/payments/checkout/${createdProduct.product.product_id}`
      )
      window.location.href = res.data.data.checkout_url
    } catch (err: any) {
      setErrors({
        general: [err.response?.data?.meta?.message || 'Payment failed'],
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create a listing</h1>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'bg-blue-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${
              i === step ? 'font-medium text-gray-900' : 'text-gray-400'
            }`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className="h-px bg-gray-200 w-6" />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">

        {/* Step 0 — Details */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Blue denim jacket, barely worn"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe the item, its history, and any defects..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.price && (
                  <p className="text-xs text-red-500 mt-1">{errors.price[0]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
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
              {errors.category_id && (
                <p className="text-xs text-red-500 mt-1">{errors.category_id[0]}</p>
              )}
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
                  <option key={sub.subcategory_id} value={sub.subcategory_id}>
                    {sub.subcategory_name}
                  </option>
                ))}
              </select>
            </div>
          )}


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location (optional)
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Dhaka, Mirpur"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Step 1 — Images */}
        {step === 1 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Upload 3–5 images (JPEG, PNG, or WebP, max 5MB each)
            </p>
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImages}
                className="hidden"
              />
              <p className="text-3xl mb-2">📷</p>
              <p className="text-sm font-medium text-gray-700">
                Click to upload images
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {images.length}/5 uploaded
              </p>
            </label>
            {errors.images && (
              <p className="text-xs text-red-500 mt-2">{errors.images[0]}</p>
            )}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden h-28 bg-gray-100"
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Preview */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Review your listing</h2>
            {previews[0] && (
              <img
                src={previews[0]}
                alt="Preview"
                className="w-full h-56 object-cover rounded-xl"
              />
            )}
            <div className="space-y-2 text-sm">
              {[
                { label: 'Title',     value: form.title },
                { label: 'Price',     value: `$${parseFloat(form.price || '0').toFixed(2)}` },
                { label: 'Condition', value: form.condition },
                { label: 'Category',  value: categories.find((c: any) => String(c.category_id) === form.category_id)?.category_name },
                { label: 'Location',  value: form.location || '—' },
                { label: 'Images',    value: `${images.length} uploaded` },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between border-b border-gray-50 pb-1"
                >
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
              Your listing will be saved as a draft. You can pay for multiple
              listings at once from your seller dashboard.
            </div>
            {errors.general && (
              <p className="text-sm text-red-500">{errors.general[0]}</p>
            )}
          </div>
        )}

        {/* Navigation */}
        {step < 2 && (
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}
            {step < 1 ? (
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create listing'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}