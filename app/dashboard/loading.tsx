function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800 ${className}`}
    />
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SkeletonLine className="h-8 w-48" />
        <SkeletonLine className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="space-y-3">
              <SkeletonLine className="h-5 w-40" />
              <SkeletonLine className="h-4 w-full max-w-xl" />
              <SkeletonLine className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
