'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>
      {loading ? <Skeleton className="h-8 w-full" /> : (
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
