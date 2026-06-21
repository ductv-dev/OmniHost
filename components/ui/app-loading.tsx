import { cn } from '@/lib/utils'
import { LumaSpin } from '@/components/ui/luma-spin'

interface AppLoadingProps {
  label?: string
  className?: string
  compact?: boolean
}

export function AppLoading({
  label = 'Đang tải dữ liệu',
  className,
  compact = false,
}: AppLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'min-h-48 gap-4' : 'min-h-[60dvh] gap-5',
        className
      )}
    >
      <LumaSpin />
      <div>
        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{label}</p>
        <p className="mt-1 text-xs text-zinc-400">OmniHost đang chuẩn bị mọi thứ</p>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
