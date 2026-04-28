'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { Category } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/categories')
      setCategories(data.data || [])
    } catch { setCategories([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchCategories() }, [])

  const create = async () => {
    if (!newName) return
    try {
      await api.post('/admin/categories', { category_name: newName, description: newDesc })
      toast.success('Category created')
      setNewName('')
      setNewDesc('')
      fetchCategories()
    } catch { toast.error('Failed') }
  }

  const toggleActive = async (cat: Category) => {
    try {
      await api.put(`/admin/categories/${cat.category_id}`, { is_active: !cat.is_active })
      toast.success('Updated')
      fetchCategories()
    } catch { toast.error('Failed') }
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage product categories</p>
        </div>

        <div className="flex gap-2">
          <Input placeholder="Category name" value={newName} onChange={(e) => setNewName(e.target.value)} className="max-w-xs" />
          <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="max-w-sm" />
          <Button onClick={create}>Add</Button>
        </div>

        {loading ? <Skeleton className="h-8 w-full" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.category_id}>
                  <TableCell className="font-medium">{c.category_name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.description || '—'}</TableCell>
                  <TableCell><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Yes' : 'No'}</Badge></TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(c)}>
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </DashboardLayout>
  )
}
