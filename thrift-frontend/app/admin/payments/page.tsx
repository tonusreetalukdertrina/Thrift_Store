'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'

export default function AdminPaymentsPage() {
  return (
    <AuthGuard adminOnly>
      <AdminPaymentsContent />
    </AuthGuard>
  )
}

function AdminPaymentsContent() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('')
  const [q, setQ]             = useState('')

  useEffect(() => { fetchPayments() }, [status])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/payments', { params: { status, q } })
      setData(res.data.data)
    } catch (_) {}
    finally { setLoading(false) }
  }

  const payments = data?.payments?.data || []
  const summary  = data?.summary || {}

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <Link href="/admin/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Dashboard
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total revenue',   value: `$${parseFloat(summary.total_paid || 0).toFixed(2)}`,  color: 'text-green-600' },
          { label: 'Failed payments', value: summary.failed_count  || 0, color: 'text-red-600'   },
          { label: 'Pending',         value: summary.pending_count || 0, color: 'text-yellow-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
          placeholder="Search seller name or email..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <button
          onClick={fetchPayments}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-blue-700 transition"
        >
          Filter
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No transactions found</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Seller</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Listing</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p: any) => (
                <tr key={p.payment_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.seller?.name}</p>
                    <p className="text-xs text-gray-400">{p.seller?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">
                    {p.product?.title || 'Deleted listing'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    ${parseFloat(p.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === 'paid'    ? 'bg-green-100 text-green-700'  :
                      p.status === 'failed'  ? 'bg-red-100 text-red-700'     :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {p.paid_at
                      ? new Date(p.paid_at).toLocaleDateString()
                      : new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono max-w-[120px] truncate">
                    {p.transaction_ref?.slice(0, 20)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}