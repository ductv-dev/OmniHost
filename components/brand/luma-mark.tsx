import { cn } from '@/lib/utils'

export function LumaMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-block shrink-0 overflow-hidden rounded-[28%]',
        inverted ? 'bg-white' : 'bg-zinc-950 dark:bg-white',
        className
      )}
    >
      <span className={cn('absolute left-[18%] top-[18%] size-[38%] rounded-[32%] border-[2px]', inverted ? 'border-zinc-950' : 'border-white dark:border-zinc-950')} />
      <span className={cn('absolute bottom-[18%] right-[18%] size-[38%] rounded-[32%] border-[2px]', inverted ? 'border-zinc-950' : 'border-white dark:border-zinc-950')} />
    </span>
  )
}
