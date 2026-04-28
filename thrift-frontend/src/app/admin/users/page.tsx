'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

interface AdminUser {
  user_id: string
  name: string
  email: string
  phone: string
  role: string
  is_blocked: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const fetchUsers = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/users', { params: { page: p, q } })
      setUsers(data.data.data || [])
      setPage(data.data.current_page || 1)
      setLastPage(data.data.last_page || 1)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleBlock = async (id: string, blocked: boolean) => {
    try {
      await api.patch(`/admin/users/${id}/${blocked ? 'unblock' : 'block'}`)
      toast.success(blocked ? 'User unblocked' : 'User blocked')
      fetchUsers(page)
    } catch {
      toast.error('Failed')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <div className="flex gap-2 mb-4">
        <Input placeholder="Search by name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Button onClick={() => fetchUsers(1)}><Search className="w-4 h-4" /></Button>
      </div>

      {loading ? (
        <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={u.is_blocked ? 'destructive' : 'secondary'}>
                      {u.is_blocked ? 'Blocked' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => toggleBlock(u.user_id, u.is_blocked)}>
                      {u.is_blocked ? 'Unblock' : 'Block'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {lastPage > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => fetchUsers(page - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page === lastPage} onClick={() => fetchUsers(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
