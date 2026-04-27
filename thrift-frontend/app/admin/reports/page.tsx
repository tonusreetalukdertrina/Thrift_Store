'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import AuthGuard from '@/components/AuthGuard'

const ACTIONS = [
  { value: 'dismiss', label: 'Dismiss',      color: 'text-gray-600 border-gray-300 hover:bg-gray-50' },
  { value: 'warn',    label: 'Warn user',    color: 'text-amber-600 border-amber-300 hover:bg-amber-50' },
  { value: 'remove',  label: 'Remove',       color: 'text-red-600 border-red-300 hover:bg-red-50' },
  { value: 'block',   label: 'Block user',   color: 'text-red-700 border-red-400 hover:bg-red-50' },
]

export default function AdminReportsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [reports, setReports]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [acting, setActing]     = useState<string | null>(null)
  const [notes, setNotes]       = useState<Record<string, string>>({})

  useEffect(() => {
    fetchReports()
    }, [statusFilter])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/reports', { params: { status: statusFilter } })
      setReports(res.data.data.data || [])
    } catch (_) {}
    finally { setLoading(false) }
  }

  const resolveReport = async (reportId: string, action: string) => {
    const label = ACTIONS.find((a) => a.value === action)?.label
    if (!confirm(`${label} this report?`)) return
    setActing(reportId)
    try {
      await api.patch(`/admin/reports/${reportId}/resolve`, {
        action,
        admin_notes: notes[reportId] || '',
      })
      setReports(reports.filter((r) => r.report_id !== reportId))
    } catch (err: any) {
      alert(err.response?.data?.meta?.message || 'Failed')
    } finally {
      setActing(null)
    }
  }

  return (
    <AuthGuard adminOnly>
        <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Flagged content</h1>
        <a href="/admin/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</a>
      </div>

      <div className="flex gap-2 mb-6">
        {['pending', 'resolved'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>No {statusFilter} reports</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.report_id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      report.target_type === 'user'    ? 'bg-purple-100 text-purple-700' :
                      report.target_type === 'product' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {report.target_type}
                    </span>
                    <span className="text-xs text-gray-400">
                      Reported by {report.reporter?.name}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    Target ID: <span className="font-mono text-xs text-gray-500">{report.target_id}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>

              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-3">
                {report.reason}
              </p>

              {report.status === 'pending' && (
                <>
                  <textarea
                    value={notes[report.report_id] || ''}
                    onChange={(e) => setNotes({ ...notes, [report.report_id]: e.target.value })}
                    placeholder="Admin notes (optional)..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none mb-3"
                  />
                  <div className="flex flex-wrap gap-2">
                    {ACTIONS.map((action) => (
                      <button
                        key={action.value}
                        onClick={() => resolveReport(report.report_id, action.value)}
                        disabled={acting === report.report_id}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${action.color}`}
                      >
                        {acting === report.report_id ? '...' : action.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {report.status === 'resolved' && (
                <div className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  Resolved · {report.admin_notes || 'No notes'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </AuthGuard>
  )
}