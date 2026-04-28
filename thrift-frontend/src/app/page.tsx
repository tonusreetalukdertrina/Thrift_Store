import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mb-6">
        T
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-3">
        ThriftStore
      </h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Buy and sell second-hand clothes, books, and crafts. Give pre-loved items a new home.
      </p>
      <div className="flex gap-3">
        <Link href="/search"><Button size="lg">Browse listings</Button></Link>
        <Link href="/auth/register"><Button variant="outline" size="lg">Start selling</Button></Link>
      </div>
    </div>
  )
}
