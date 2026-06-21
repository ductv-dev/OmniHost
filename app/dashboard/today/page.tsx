'use client'

import { useBuilding } from '@/components/building-context'
import BookingDetailDrawer from '@/components/calendar/BookingDetailDrawer'
import type { CalBooking, CalRoom } from '@/components/calendar/TimelineCalendar'
import SourceIcon from '@/components/booking/SourceIcon'
import { Calendar } from '@/components/ui/calendar'
import type { BookingSource } from '@/types/booking'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { addDays, differenceInDays, format, isToday, parseISO, startOfToday, subDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Building2, CalendarDays, LogIn, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Drawer } from 'vaul'

type TodayBooking = CalBooking & {
  check_in_time: string | null
  check_out_time: string | null
}

const STATUS_COLORS: Record<string, string> = {
  confirmed:   'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  checked_in:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  checked_out: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  no_show:     'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
}
const STATUS_LABELS: Record<string, string> = {
  confirmed:   'Đã xác nhận',
  checked_in:  'Đang ở',
  checked_out: 'Đã trả phòng',
  no_show:     'Không đến',
}
const SOURCE_LABELS: Record<string, string> = {
  airbnb: 'Airbnb', booking: 'Booking.com', agoda: 'Agoda',
  direct: 'Khách lẻ', facebook: 'Facebook', tiktok: 'TikTok',
}

const SELECT_BOOKING =
  'id, room_id, check_in, check_out, check_in_time, check_out_time, status, source, guest_type, total_price, deposit_paid, num_adults, num_children, note, guest:guests(id, full_name, phone, email, country)'

export default function TodayPage() {
  const { selectedId, selectedBuilding, loading: buildingLoading } = useBuilding()
  const [tab, setTab] = useState<'checkin' | 'checkout'>('checkin')
  const [selectedDate, setSelectedDate] = useState(() => startOfToday())
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<TodayBooking | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['today', selectedId, selectedDateString],
    queryFn: async () => {
      const supabase = createClient()
      const rangeStart = format(subDays(selectedDate, 7), 'yyyy-MM-dd')
      const rangeEnd   = format(addDays(selectedDate, 60), 'yyyy-MM-dd')

      const [checkInsRes, checkOutsRes, roomsRes, allBookingsRes] = await Promise.all([
        supabase.from('bookings').select(SELECT_BOOKING)
          .eq('building_id', selectedId!).eq('check_in', selectedDateString).neq('status', 'cancelled'),
        supabase.from('bookings').select(SELECT_BOOKING)
          .eq('building_id', selectedId!).eq('check_out', selectedDateString).neq('status', 'cancelled'),
        supabase.from('rooms').select('id, room_number, floor, default_price')
          .eq('building_id', selectedId!).eq('is_active', true).order('sort_order').order('room_number'),
        supabase.from('bookings').select(SELECT_BOOKING)
          .eq('building_id', selectedId!).neq('status', 'cancelled')
          .lte('check_in', rangeEnd).gte('check_out', rangeStart),
      ])

      return {
        checkIns:    (checkInsRes.data ?? [])    as unknown as TodayBooking[],
        checkOuts:   (checkOutsRes.data ?? [])   as unknown as TodayBooking[],
        rooms:       (roomsRes.data ?? [])       as CalRoom[],
        allBookings: (allBookingsRes.data ?? []) as unknown as CalBooking[],
      }
    },
    enabled: !!selectedId,
  })

  const checkIns    = data?.checkIns    ?? []
  const checkOuts   = data?.checkOuts   ?? []
  const rooms       = data?.rooms       ?? []
  const allBookings = data?.allBookings ?? []
  const activeList  = tab === 'checkin' ? checkIns : checkOuts

  const selectedRoom = selectedBooking
    ? (rooms.find(r => r.id === selectedBooking.room_id) ?? null)
    : null

  if (buildingLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
      </div>
    )
  }

  if (!selectedId) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <Building2 className="size-7 text-zinc-400" />
        </div>
        <div>
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">Chưa có tòa nhà</p>
          <p className="mt-1 text-sm text-zinc-500">Nhấn menu để chọn tòa nhà</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-zinc-500">{selectedBuilding?.name}</p>
            <h1 className="text-xl font-bold capitalize tracking-tight">
              {format(selectedDate, 'EEEE, dd/MM', { locale: vi })}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setDatePickerOpen(true)}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors active:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            aria-label="Chọn ngày"
          >
            <CalendarDays className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800/60">
          {(['checkin', 'checkout'] as const).map(t => {
            const isActive = tab === t
            const count = t === 'checkin' ? checkIns.length : checkOuts.length
            const Icon = t === 'checkin' ? LogIn : LogOut
            const label = t === 'checkin' ? 'Check-in' : 'Check-out'
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-white shadow-sm dark:bg-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Icon className="size-4" />
                <span>{label}</span>
                {count > 0 && (
                  <span className={`rounded-full px-1.5 text-[11px] font-bold ${
                    isActive
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                      : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : activeList.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            {tab === 'checkin'
              ? <><LogIn className="size-8 text-zinc-300" /><p className="text-sm text-zinc-400">Không có check-in trong ngày này</p></>
              : <><LogOut className="size-8 text-zinc-300" /><p className="text-sm text-zinc-400">Không có check-out trong ngày này</p></>
            }
          </div>
        ) : (
          <div className="space-y-2">
            {activeList.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                room={rooms.find(r => r.id === booking.room_id) ?? null}
                tab={tab}
                onTap={() => { setSelectedBooking(booking); setDetailOpen(true) }}
              />
            ))}
          </div>
        )}
      </div>

      <BookingDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        booking={selectedBooking}
        room={selectedRoom}
        rooms={rooms}
        allBookings={allBookings}
        onSuccess={() => refetch()}
      />

      <Drawer.Root open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm" />
          <Drawer.Content className="fixed right-0 bottom-0 left-0 z-60 flex max-h-[92svh] flex-col rounded-t-[2rem] border-t border-white/20 bg-white shadow-2xl dark:bg-zinc-950">
            <div className="shrink-0 px-5 pt-4 pb-3">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Drawer.Title className="text-base font-bold">Chọn ngày</Drawer.Title>
                  <p className="mt-0.5 text-sm capitalize text-zinc-500">
                    {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                  </p>
                </div>
                {!isToday(selectedDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(startOfToday())
                      setDatePickerOpen(false)
                    }}
                    className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    Hôm nay
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-1 items-start justify-center overflow-y-auto px-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date)
                    setDatePickerOpen(false)
                  }
                }}
                locale={vi}
                classNames={{
                  root: 'w-full',
                  month_grid: 'w-full',
                  weekday: 'flex-1 py-1 text-center text-xs text-zinc-400',
                  week: 'flex w-full',
                  day: 'flex-1 text-center',
                }}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────────

function BookingCard({
  booking, room, tab, onTap,
}: {
  booking: TodayBooking
  room: CalRoom | null
  tab: 'checkin' | 'checkout'
  onTap: () => void
}) {
  const remaining = booking.total_price - booking.deposit_paid
  const nights    = differenceInDays(parseISO(booking.check_out), parseISO(booking.check_in))
  const timeStr   = tab === 'checkin'
    ? (booking.check_in_time  ?? '14:00')
    : (booking.check_out_time ?? '12:00')

  return (
    <button
      onClick={onTap}
      className="w-full rounded-2xl border border-zinc-100 bg-white px-4 py-3.5 text-left shadow-sm transition-transform active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Row 1: room + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
            {room?.room_number ?? '—'}
          </span>
          {room?.floor != null && (
            <span className="text-xs text-zinc-400">T{room.floor}</span>
          )}
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_COLORS[booking.status] ?? 'bg-zinc-100 text-zinc-500'}`}>
          {STATUS_LABELS[booking.status] ?? booking.status}
        </span>
      </div>

      {/* Row 2: guest + source */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="truncate font-semibold text-zinc-900 dark:text-white">
          {booking.guest?.full_name ?? 'Khách'}
        </p>
        <div className="flex shrink-0 items-center gap-1 text-xs text-zinc-400">
          <SourceIcon source={booking.source as BookingSource} size={11} />
          <span>{SOURCE_LABELS[booking.source] ?? booking.source}</span>
        </div>
      </div>

      {/* Row 3: time + guests + nights */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-lg bg-zinc-950 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-white dark:text-zinc-950">
          {timeStr}
        </span>
        <span className="text-[11px] text-zinc-400">
          {booking.num_adults} NL{booking.num_children > 0 ? ` · ${booking.num_children} trẻ` : ''}
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <span className="text-[11px] text-zinc-400">{nights} đêm</span>
        {booking.guest?.phone && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span className="text-[11px] text-zinc-400">{booking.guest.phone}</span>
          </>
        )}
      </div>

      {/* Row 4: payment */}
      <div className="mt-2.5 flex items-center justify-between border-t border-zinc-50 pt-2.5 dark:border-zinc-800">
        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
          {booking.total_price.toLocaleString('vi-VN')}đ
        </span>
        {remaining > 0 ? (
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            Còn {remaining.toLocaleString('vi-VN')}đ
          </span>
        ) : (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Đã thanh toán đủ ✓
          </span>
        )}
      </div>
    </button>
  )
}
