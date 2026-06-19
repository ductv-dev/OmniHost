import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { differenceInDays, parseISO, format } from 'date-fns'
import { BookingStatusBadge, BookingSourceBadge } from '@/components/booking/BookingStatusBadge'
import type { BookingWithDetails } from '@/types/booking'

export default async function BookingsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('bookings')
    .select(`
      *,
      guest:guests(full_name, phone, country),
      room:rooms(room_number),
      building:buildings(name)
    `)
    .order('check_in', { ascending: false })
    .limit(100)

  const bookings = (data ?? []) as unknown as BookingWithDetails[]

  const active = bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'checked_out')
  const past = bookings.filter((b) => b.status === 'checked_out' || b.status === 'cancelled')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-zinc-500">{active.length} đang hoạt động</p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="flex size-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-lg transition-transform active:scale-95 dark:bg-white dark:text-zinc-950"
          aria-label="Tạo booking mới"
        >
          <Plus className="size-5" />
        </Link>
      </div>

      {/* Active bookings */}
      {active.length > 0 && (
        <section className="space-y-2">
          {active.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </section>
      )}

      {/* Past bookings */}
      {past.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Lịch sử
          </p>
          {past.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </section>
      )}

      {/* Empty */}
      {bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-zinc-500">Chưa có booking nào.</p>
          <Link
            href="/dashboard/bookings/new"
            className="mt-4 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950"
          >
            Tạo booking đầu tiên
          </Link>
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking: b }: { booking: BookingWithDetails }) {
  const nights = differenceInDays(parseISO(b.check_out), parseISO(b.check_in))
  const remaining = b.total_price - b.deposit_paid

  return (
    <Link
      href={`/dashboard/bookings/${b.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-transform active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-900 dark:text-white">
            {b.guest?.full_name ?? '—'}
          </p>
          <p className="text-sm text-zinc-500">
            {b.building?.name} · {b.room?.room_number}
          </p>
        </div>
        <BookingStatusBadge status={b.status} />
      </div>

      {/* Dates */}
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <span>{format(parseISO(b.check_in), 'dd/MM')}</span>
        <span className="text-zinc-300">→</span>
        <span>{format(parseISO(b.check_out), 'dd/MM/yyyy')}</span>
        <span className="text-zinc-400">({nights} đêm)</span>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <BookingSourceBadge source={b.source} />
        <div className="text-right">
          <p className="text-sm font-bold text-zinc-900 dark:text-white">
            {b.total_price.toLocaleString('vi-VN')}đ
          </p>
          {remaining > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              còn {remaining.toLocaleString('vi-VN')}đ
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
