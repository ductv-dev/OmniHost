import Link from 'next/link'
import { ArrowRight, Building2, Key, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LumaMark } from '@/components/brand/luma-mark'

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-50">
      <header className="flex items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <LumaMark className="size-8" inverted />
          <span className="text-xl font-bold tracking-tight">OmniHost</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-zinc-400">
            Sign In
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col justify-end px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-1.5 text-sm text-zinc-300">
            <span className="relative flex h-2.5 w-2.5 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            Ready for mobile use
          </div>
          
          <h1 className="max-w-sm text-5xl font-extrabold tracking-tight">
            Host messages, ready in seconds.
          </h1>
          
          <p className="max-w-sm text-base leading-7 text-zinc-400">
            Create reusable replies, fill room data, and copy check-in messages from your phone.
          </p>
          
          <div className="grid gap-3 pt-2">
            <Link href="/dashboard">
              <Button size="lg" className="h-12 w-full rounded-lg bg-white px-5 text-base font-semibold text-zinc-950 hover:bg-zinc-200">
                Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard/generator">
              <Button size="lg" variant="outline" className="h-12 w-full rounded-lg border-zinc-800 bg-transparent px-5 text-base font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white">
                <MessageSquare className="mr-2 h-5 w-5" /> Try Generator
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3">
          <div className="rounded-lg bg-zinc-900 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
              <Building2 className="h-5 w-5 text-zinc-400" />
            </div>
              <p className="mt-2 text-xs font-medium text-zinc-200">Rooms</p>
          </div>
          <div className="rounded-lg bg-zinc-900 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
              <Key className="h-5 w-5 text-zinc-400" />
            </div>
              <p className="mt-2 text-xs font-medium text-zinc-200">Codes</p>
          </div>
          <div className="rounded-lg bg-zinc-900 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
              <MessageSquare className="h-5 w-5 text-zinc-400" />
            </div>
              <p className="mt-2 text-xs font-medium text-zinc-200">Replies</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
