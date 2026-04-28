'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { Report } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const fetchReports = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/reports', { params: { page: p } })
      setReports(data.data.data || [])
      setPage(data.data.current_page || 1)
      setLastPage(data.data.last_page || 1)
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  const resolve = async (id: string, action: string) => {
    try {
      await api.patch(`/admin/reports/${id}/resolve`, { action, admin_notes: 'Resolved by admin' })
      toast.success(`Report resolved: ${action}`)
      fetchReports(page)
    } catch { toast.error('Failed') }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      {loading ? (
        <Skeleton className="h-8 w-full" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.report_id}>
                  <TableCell className="font-mono text-xs">{r.target_id.slice(0, 8)}…</TableCell>
                  <TableCell><Badge variant="outline">{r.target_type}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate">{r.reason}</TableCell>
                  <TableCell>{r.reporter?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'pending' ? 'outline' : 'secondary'}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="space-x-1">
                    {r.status === 'pending' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => resolve(r.report_id, 'dismiss')}>Dismiss</Button>
                        <Button variant="outline" size="sm" onClick={() => resolve(r.report_id, 'warn')}>Warn</Button>
                        <Button variant="destructive" size="sm" onClick={() => resolve(r.report_id, 'remove')}>Remove</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {lastPage > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => fetchReports(page - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page === lastPage} onClick={() => fetchReports(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
