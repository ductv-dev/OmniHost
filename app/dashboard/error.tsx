'use client'

import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <div className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/60 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-300">
          Could not load this page
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          The dashboard could not fetch its data. If this happened after a deploy,
          run the Supabase migration/reset SQL and try again.
        </p>
        {error.message && (
          <p className="mt-3 rounded-md bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-200">
            {error.message}
          </p>
        )}
        <Button onClick={reset} className="mt-5 rounded-lg">
          Try again
        </Button>
      </div>
    </div>
  )
}
