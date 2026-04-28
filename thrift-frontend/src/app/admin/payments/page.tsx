'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { Payment } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Clock, BarChart3 } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'

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
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground">View all payment transactions</p>
        </div>
        {loading ? <Skeleton className="h-8 w-full" /> : payments.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Payment tracking coming soon</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                We are building a comprehensive payment dashboard with detailed transaction history, revenue analytics, and payout management.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
                  <Clock className="w-3 h-3" />
                  Transaction history
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
                  <BarChart3 className="w-3 h-3" />
                  Revenue analytics
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
                  <DollarSign className="w-3 h-3" />
                  Payout management
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
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
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page === lastPage} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
