'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { Report } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Shield, Flag, Clock } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/DashboardLayout'

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
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Review and resolve user reports</p>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-full" />
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Report management coming soon</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                An advanced reporting system is under development with automated flagging, priority queues, and resolution workflows.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
                  <Flag className="w-3 h-3" />
                  User reports
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
                  <Shield className="w-3 h-3" />
                  Content moderation
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
                  <Clock className="w-3 h-3" />
                  Priority queues
                </span>
              </div>
            </CardContent>
          </Card>
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
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => fetchReports(page - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page === lastPage} onClick={() => fetchReports(page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
