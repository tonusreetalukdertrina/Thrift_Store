'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { Payment } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.get('/admin/payments', { params: { page } })
      .then(({ data }) => {
        setPayments(data.data.data || [])
        setPage(data.data.current_page || 1)
        setLastPage(data.data.last_page || 1)
      })
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }, [page])

  const statusStyles: Record<string, string> = { pending: 'outline', paid: 'default', failed: 'destructive' }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Payments</h1>
      {loading ? <Skeleton className="h-8 w-full" /> : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.payment_id}>
                  <TableCell>{p.listing?.title || 'Unknown'}</TableCell>
                  <TableCell>${parseFloat(p.amount).toFixed(2)}</TableCell>
                  <TableCell>{p.method || '—'}</TableCell>
                  <TableCell><Badge variant={statusStyles[p.status] as any}>{p.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {lastPage > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page === lastPage} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
