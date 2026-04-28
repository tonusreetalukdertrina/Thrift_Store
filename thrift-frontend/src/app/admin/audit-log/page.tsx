'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Shield, Clock, Search } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface AuditEntry {
  log_id: number
  admin_id: string
  action: string
  target_type: string
  target_id: string
  metadata: Record<string, any> | null
  performed_at: string
  admin?: { name: string }
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.get('/admin/audit-log', { params: { page } })
      .then(({ data }) => {
        setEntries(data.data.data || [])
        setPage(data.data.current_page || 1)
        setLastPage(data.data.last_page || 1)
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Track admin actions</p>
        </div>
        {loading ? <Skeleton className="h-8 w-full" /> : entries.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Audit log coming soon</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                A detailed activity log is being built to track all admin actions, user changes, and system events for full transparency.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
                  <Shield className="w-3 h-3" />
                  Admin activity tracking
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
                  <Search className="w-3 h-3" />
                  Searchable history
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
                  <Clock className="w-3 h-3" />
                  Real-time events
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.log_id}>
                    <TableCell>{e.admin?.name || 'Unknown'}</TableCell>
                    <TableCell className="font-mono text-sm">{e.action}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.target_type}:{e.target_id.slice(0, 8)}…</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(e.performed_at).toLocaleString()}</TableCell>
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
