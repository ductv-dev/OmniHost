import { Badge } from '@/components/ui/badge'
import type { BookingSource, BookingStatus } from '@/types/booking'
import SourceIcon from './SourceIcon'

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  confirmed:   { label: 'Đã đặt',       className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  checked_in:  { label: 'Đang ở',        className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  checked_out: { label: 'Đã trả phòng', className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  cancelled:   { label: 'Đã hủy',       className: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' },
  no_show:     { label: 'Không đến',    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
}

const SOURCE_CONFIG: Record<BookingSource, { label: string; className: string }> = {
  airbnb:   { label: 'Airbnb',       className: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  booking:  { label: 'Booking.com',  className: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  agoda:    { label: 'Agoda',        className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  direct:   { label: 'Khách lẻ',    className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  facebook: { label: 'Facebook',     className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
  tiktok:   { label: 'TikTok',       className: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

export function BookingSourceBadge({ source }: { source: BookingSource }) {
  const cfg = SOURCE_CONFIG[source]
  return (
    <Badge className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      <SourceIcon source={source} size={11} />
      {cfg.label}
    </Badge>
  )
}
