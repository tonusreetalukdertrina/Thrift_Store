'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import AuthGuard from '@/components/AuthGuard'

const ACTION_COLORS: Record<string, string> = {
  block_user:      'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  unblock_user:    'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  remove_product:  'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
  remove_review:   'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
  resolve_report:  'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
  create_category: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
  update_category: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
}

export default function AuditLogPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [logs, setLogs]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/audit-log')
        .then((res) => setLogs(res.data.data.data || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, [])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Audit log
            </h1>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
            >
              ← Dashboard
            </button>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="divide-y divide-slate-100">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="px-6 py-20 text-center text-sm text-slate-500">
                No audit log entries yet
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/60">
                  <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Target</th>
                    <th className="px-6 py-3">Admin</th>
                    <th className="px-6 py-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {logs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                            ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200'
                          }`}
                        >
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">{log.target_type}</p>
                        <p className="mt-0.5 font-mono text-xs text-slate-500">{log.target_id}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-800">
                        {log.admin?.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-500">
                        {new Date(log.performed_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
