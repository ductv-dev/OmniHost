import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, User, CalendarDays, Clock, Users, Moon, Banknote } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { differenceInDays, parseISO, format } from 'date-fns'
import { BookingStatusBadge, BookingSourceBadge } from '@/components/booking/BookingStatusBadge'
import { BookingActions } from './booking-actions'
import type { BookingWithDetails } from '@/types/booking'

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('bookings')
    .select(`
      *,
      guest:guests(full_name, phone, email, country, gender),
      room:rooms(room_number, default_price),
      building:buildings(name)
    `)
    .eq('id', id)
    .single()

  if (!data) notFound()

  const b = data as unknown as BookingWithDetails
  const nights = differenceInDays(parseISO(b.check_out), parseISO(b.check_in))
  const remaining = b.total_price - b.deposit_paid

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/bookings"
          className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-transform active:scale-95 dark:bg-zinc-800"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight">
            {b.guest?.full_name ?? 'Booking chi tiết'}
          </h1>
          <p className="text-xs text-zinc-500">
            {b.building?.name} · {b.room?.room_number}
          </p>
        </div>
        <div className="flex gap-1.5">
          <BookingStatusBadge status={b.status} />
        </div>
      </div>

      {/* Dates card */}
      <InfoCard>
        <InfoRow icon={<CalendarDays className="size-4" />} label="Nhận phòng">
          {format(parseISO(b.check_in), 'EEEE, dd/MM/yyyy')}
        </InfoRow>
        <InfoRow icon={<Clock className="size-4" />} label="Giờ nhận">
          {b.check_in_time}
        </InfoRow>
        <InfoRow icon={<CalendarDays className="size-4" />} label="Trả phòng">
          {format(parseISO(b.check_out), 'EEEE, dd/MM/yyyy')}
        </InfoRow>
        <InfoRow icon={<Clock className="size-4" />} label="Giờ trả">
          {b.check_out_time}
        </InfoRow>
        <InfoRow icon={<Moon className="size-4" />} label="Số đêm">
          {nights} đêm
        </InfoRow>
      </InfoCard>

      {/* Guest card */}
      {b.guest && (
        <InfoCard>
          <InfoRow icon={<User className="size-4" />} label="Khách">
            {b.guest.full_name}
          </InfoRow>
          {b.guest.phone && (
            <InfoRow icon={<span className="text-xs">📞</span>} label="SĐT">
              <a href={`tel:${b.guest.phone}`} className="text-blue-600 underline dark:text-blue-400">
                {b.guest.phone}
              </a>
            </InfoRow>
          )}
          {b.guest.email && (
            <InfoRow icon={<span className="text-xs">✉️</span>} label="Email">
              {b.guest.email}
            </InfoRow>
          )}
          {b.guest.country && (
            <InfoRow icon={<span className="text-xs">🌍</span>} label="Quốc tịch">
              {b.guest.country}
            </InfoRow>
          )}
          <InfoRow icon={<Users className="size-4" />} label="Số người">
            {b.num_adults} người lớn{b.num_children > 0 ? `, ${b.num_children} trẻ em` : ''}
          </InfoRow>
        </InfoCard>
      )}

      {/* Booking meta card */}
      <InfoCard>
        <InfoRow icon={<span className="text-xs">📌</span>} label="Nguồn">
          <BookingSourceBadge source={b.source} />
        </InfoRow>
        <InfoRow icon={<span className="text-xs">🏷️</span>} label="Loại">
          {b.guest_type === 'short_stay' ? 'Ngắn ngày' : 'Dài ngày'}
        </InfoRow>
        {b.note && (
          <InfoRow icon={<span className="text-xs">📝</span>} label="Ghi chú">
            {b.note}
          </InfoRow>
        )}
      </InfoCard>

      {/* Payment card */}
      <InfoCard>
        <InfoRow icon={<Banknote className="size-4" />} label="Tổng tiền">
          <span className="font-bold">{b.total_price.toLocaleString('vi-VN')}đ</span>
        </InfoRow>
        <InfoRow icon={<span className="text-xs">✅</span>} label="Đã cọc">
          {b.deposit_paid.toLocaleString('vi-VN')}đ
        </InfoRow>
        <InfoRow
          icon={<span className="text-xs">{remaining > 0 ? '⚠️' : '✅'}</span>}
          label="Còn lại"
        >
          <span className={remaining > 0 ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-green-600'}>
            {remaining.toLocaleString('vi-VN')}đ
          </span>
        </InfoRow>
      </InfoCard>

      {/* Actions */}
      {b.status !== 'cancelled' && b.status !== 'checked_out' && (
        <BookingActions bookingId={b.id} currentStatus={b.status} />
      )}
    </div>
  )
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-100 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
        {icon}
      </span>
      <span className="w-24 shrink-0 text-sm text-zinc-500">{label}</span>
      <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-white">{children}</span>
    </div>
  )
}
