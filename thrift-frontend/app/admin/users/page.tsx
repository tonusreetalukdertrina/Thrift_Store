'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import AuthGuard from '@/components/AuthGuard'

export default function AdminUsersPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [users, setUsers]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [acting, setActing]   = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
    }, [])
  const fetchUsers = async (search = '') => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users', { params: { q: search } })
      setUsers(res.data.data.data || [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(q)
  }

  const toggleBlock = async (userId: string, isBlocked: boolean) => {
    const action  = isBlocked ? 'unblock' : 'block'
    const confirm = window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this user?`)
    if (!confirm) return
    setActing(userId)
    try {
      await api.patch(`/admin/users/${userId}/${action}`)
      setUsers(users.map((u) =>
        u.user_id === userId ? { ...u, is_blocked: !isBlocked } : u
      ))
    } catch (err: any) {
      alert(err.response?.data?.meta?.message || 'Action failed')
    } finally {
      setActing(null)
    }
  }

  return (
    <AuthGuard adminOnly>
        <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User management</h1>
        <a href="/admin/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</a>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-blue-700 transition"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        u.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {u.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => toggleBlock(u.user_id, u.is_blocked)}
                          disabled={acting === u.user_id}
                          className={`text-xs px-3 py-1 rounded-lg border transition disabled:opacity-50 ${
                            u.is_blocked
                              ? 'border-green-300 text-green-600 hover:bg-green-50'
                              : 'border-red-300 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {acting === u.user_id ? '...' : u.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </AuthGuard>
  )
}