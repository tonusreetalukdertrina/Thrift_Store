'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { Listing } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/DashboardLayout'

const statusStyles: Record<string, string> = {
  draft: 'secondary',
  active: 'default',
  interested: 'outline',
  sold: 'default',
  archived: 'secondary',
} as const

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const fetchListings = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/listings', { params: { page: p, q } })
      setListings(data.data.data || [])
      setPage(data.data.current_page || 1)
      setLastPage(data.data.last_page || 1)
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchListings() }, [])

  const remove = async (id: string) => {
    try {
      await api.delete(`/admin/listings/${id}`)
      toast.success('Listing archived')
      fetchListings(page)
    } catch { toast.error('Failed') }
  }

  const restore = async (id: string) => {
    try {
      await api.patch(`/admin/listings/${id}/restore`)
      toast.success('Listing restored')
      fetchListings(page)
    } catch { toast.error('Failed') }
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Listings</h1>
          <p className="text-sm text-muted-foreground">Manage all platform listings</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search by title…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
          <Button onClick={() => fetchListings(1)}><Search className="w-4 h-4" /></Button>
        </div>
        {loading ? (
          <div className="space-y-2"><Skeleton className="h-8 w-full" /></div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((l) => (
                  <TableRow key={l.listing_id}>
                    <TableCell className="font-medium">{l.title}</TableCell>
                    <TableCell>{l.seller?.name || 'Unknown'}</TableCell>
                    <TableCell>${parseFloat(l.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={statusStyles[l.status] as any}>{l.status}</Badge>
                    </TableCell>
                    <TableCell className="space-x-1">
                      <Button variant="outline" size="sm" onClick={() => remove(l.listing_id)}>Archive</Button>
                      {l.status === 'archived' && (
                        <Button variant="outline" size="sm" onClick={() => restore(l.listing_id)}>Restore</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {lastPage > 1 && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => fetchListings(page - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page === lastPage} onClick={() => fetchListings(page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
