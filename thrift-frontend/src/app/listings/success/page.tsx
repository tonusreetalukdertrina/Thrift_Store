'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      setVerifying(false)
      return
    }
    api.post('/payments/verify', { session_id: sessionId })
      .then(() => {
        toast.success('Payment confirmed! Your listings are now live.')
        setVerifying(false)
      })
      .catch(() => {
        toast.error('Verification failed. Please contact support.')
        setVerifying(false)
      })
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center space-y-4">
        {verifying ? (
          <>
            <Spinner size={32} />
            <p className="text-muted-foreground">Verifying your payment…</p>
          </>
        ) : (
          <>
            <CheckCircle className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Payment successful!</h1>
            <p className="text-muted-foreground">Your listings are now live and visible to buyers.</p>
            <Button onClick={() => router.push('/dashboard/seller')}>
              Go to my listings
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={32} />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
