'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import type { Listing, Category } from '@/lib/types'
import AuthGuard from '@/components/layout/AuthGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair']

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    category_id: '',
    location: '',
  })

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get(`/listings/${params.id}`),
    ]).then(([catRes, listingRes]) => {
      setCategories(catRes.data.data || [])
      const l: Listing = listingRes.data.data
      setForm({
        title: l.title,
        description: l.description,
        price: l.price,
        condition: l.condition,
        category_id: String(l.category_id),
        location: l.location || '',
      })
    }).catch(() => {
      toast.error('Failed to load listing')
      router.push('/dashboard/seller')
    }).finally(() => setLoading(false))
  }, [params.id, router])

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/listings/${params.id}`, form)
      toast.success('Listing updated')
      router.push('/dashboard/seller')
    } catch (err: any) {
      toast.error(err.response?.data?.meta?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/dashboard/seller" className="mb-4 inline-block">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </Link>
        <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => update('title', e.target.value)} required minLength={5} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => update('description', e.target.value)} required minLength={20} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => update('condition', v ?? '')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => update('category_id', v ?? '')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.category_id} value={String(c.category_id)}>{c.category_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input id="location" value={form.location} onChange={(e) => update('location', e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Spinner className="mr-2" /> : null}
            Save changes
          </Button>
        </form>
      </div>
    </AuthGuard>
  )
}
