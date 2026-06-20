'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'
import { X, Pencil, Trash2, Phone, Mail, Globe, Users } from 'lucide-react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { deleteBooking, updateBookingStatus } from '@/app/dashboard/bookings/actions'
import SourceIcon from '@/components/booking/SourceIcon'
import type { BookingSource } from '@/types/booking'
import type { CalBooking, CalRoom } from './TimelineCalendar'
import EditBookingDrawer from './EditBookingDrawer'

const STATUS_LABELS: Record<string, string> = {
  confirmed:   'Đã xác nhận',
  checked_in:  'Đang ở',
  checked_out: 'Đã trả phòng',
  cancelled:   'Đã hủy',
  no_show:     'Không đến',
}

const STATUS_COLORS: Record<string, string> = {
  confirmed:   'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  checked_in:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  checked_out: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  cancelled:   'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
  no_show:     'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
}

const SOURCE_LABELS: Record<string, string> = {
  airbnb:   'Airbnb',
  booking:  'Booking.com',
  agoda:    'Agoda',
  direct:   'Khách lẻ',
  facebook: 'Facebook',
  tiktok:   'TikTok',
}

const NEXT_STATUS: Partial<Record<string, { label: string; value: string }>> = {
  confirmed:  { label: 'Check-in ngay', value: 'checked_in' },
  checked_in: { label: 'Check-out ngay', value: 'checked_out' },
}

interface BookingDetailDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  booking: CalBooking | null
  room: CalRoom | null
  rooms: CalRoom[]
  allBookings: CalBooking[]
  onSuccess: () => void
}

export default function BookingDetailDrawer({
  open,
  onOpenChange,
  booking,
  room,
  rooms,
  allBookings,
  onSuccess,
}: BookingDetailDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  if (!booking || !room) return null

  const nights = differenceInDays(parseISO(booking.check_out), parseISO(booking.check_in))
  const remaining = booking.total_price - booking.deposit_paid
  const nextStatus = NEXT_STATUS[booking.status]
  const canModify = booking.status !== 'cancelled' && booking.status !== 'checked_out' && booking.status !== 'no_show'

  async function handleStatusUpdate(status: string) {
    setLoading(true)
    setError(null)
    const result = await updateBookingStatus(booking!.id, status as Parameters<typeof updateBookingStatus>[1])
    setLoading(false)
    if ('error' in result) {
      setError(result.error)
    } else {
      onOpenChange(false)
      onSuccess()
    }
  }

  async function handleDelete() {
    setLoading(true)
    setError(null)
    const result = await deleteBooking(booking!.id)
    setLoading(false)
    if ('error' in result) {
      setError(result.error)
    } else {
      onOpenChange(false)
      setConfirmDelete(false)
      onSuccess()
    }
  }

  const checkInFmt  = format(parseISO(booking.check_in),  'EEE, dd/MM', { locale: vi })
  const checkOutFmt = format(parseISO(booking.check_out), 'EEE, dd/MM', { locale: vi })

  return (
    <Drawer.Root open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setConfirmDelete(false) }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[2rem] border-t border-white/20 bg-white/95 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900/95"
          aria-label="Chi tiết booking"
        >
          {/* ── Header ── */}
          <div className="shrink-0 px-5 pt-4">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Drawer.Title className="text-lg font-bold leading-tight text-zinc-950 dark:text-white">
                    {booking.guest?.full_name ?? 'Khách'}
                  </Drawer.Title>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_COLORS[booking.status] ?? STATUS_COLORS.confirmed}`}>
                    {STATUS_LABELS[booking.status] ?? booking.status}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{room.room_number}</span>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <SourceIcon source={booking.source as BookingSource} size={12} />
                  <span>{SOURCE_LABELS[booking.source] ?? booking.source}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {canModify && (
                  <button
                    onClick={() => setEditOpen(true)}
                    className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors active:scale-95 dark:bg-zinc-800"
                    aria-label="Sửa booking"
                  >
                    <Pencil className="size-4" />
                  </button>
                )}
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors active:scale-95 dark:bg-zinc-800"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto px-5 pt-4">
            <div className="space-y-3">
              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                  {error}
                </p>
              )}

              {/* ── Date banner ── */}
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-stretch gap-3">
                  {/* Check-in */}
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Nhận phòng</p>
                    <p className="mt-0.5 text-base font-bold text-zinc-950 dark:text-white capitalize">{checkInFmt}</p>
                  </div>
                  {/* Center divider */}
                  <div className="flex flex-col items-center justify-center gap-1 px-1">
                    <div className="h-px w-6 bg-zinc-300 dark:bg-zinc-600" />
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      {nights}đ
                    </span>
                    <div className="h-px w-6 bg-zinc-300 dark:bg-zinc-600" />
                  </div>
                  {/* Check-out */}
                  <div className="flex-1 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Trả phòng</p>
                    <p className="mt-0.5 text-base font-bold text-zinc-950 dark:text-white capitalize">{checkOutFmt}</p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-2 border-t border-zinc-200 pt-2.5 dark:border-zinc-700">
                  <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-300">
                    {nights} đêm
                  </span>
                  <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-300">
                    {booking.guest_type === 'long_stay' ? 'Dài ngày' : 'Ngắn ngày'}
                  </span>
                  <span className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm dark:bg-zinc-800 dark:text-zinc-300">
                    {booking.num_adults} người lớn{booking.num_children > 0 ? ` · ${booking.num_children} trẻ em` : ''}
                  </span>
                </div>
              </div>

              {/* ── Guest contact ── */}
              {booking.guest && (
                <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-100 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                  {booking.guest.phone && (
                    <a href={`tel:${booking.guest.phone}`}
                      className="flex items-center gap-3 px-4 py-3 active:bg-zinc-50 dark:active:bg-zinc-800">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                        <Phone className="size-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-zinc-400">Điện thoại</p>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{booking.guest.phone}</p>
                      </div>
                    </a>
                  )}
                  {booking.guest.email && (
                    <a href={`mailto:${booking.guest.email}`}
                      className="flex items-center gap-3 px-4 py-3 active:bg-zinc-50 dark:active:bg-zinc-800">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950">
                        <Mail className="size-3.5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-zinc-400">Email</p>
                        <p className="truncate text-sm font-semibold text-violet-600 dark:text-violet-400">{booking.guest.email}</p>
                      </div>
                    </a>
                  )}
                  {(booking.guest.country || booking.num_children > 0) && (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        {booking.guest.country
                          ? <Globe className="size-3.5 text-zinc-500" />
                          : <Users className="size-3.5 text-zinc-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        {booking.guest.country && (
                          <>
                            <p className="text-[11px] text-zinc-400">Quốc tịch</p>
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{booking.guest.country}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Payment ── */}
              <div className="grid grid-cols-3 gap-2">
                <PaymentCell label="Tổng tiền" value={booking.total_price} bold />
                <PaymentCell label="Đã cọc" value={booking.deposit_paid} />
                <PaymentCell
                  label="Còn lại"
                  value={remaining}
                  highlight={remaining > 0 ? 'amber' : remaining === 0 ? 'green' : undefined}
                />
              </div>

              {/* ── Note ── */}
              {booking.note && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-amber-600/80 dark:text-amber-500/80">Ghi chú</p>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{booking.note}</p>
                </div>
              )}

              {/* spacer for sticky footer */}
              <div className="h-2" />
            </div>
          </div>

          {/* ── Sticky footer ── */}
          {canModify && (
            <div className="shrink-0 border-t border-zinc-100 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 dark:border-zinc-800">
              {!confirmDelete ? (
                <div className="flex gap-2">
                  {nextStatus && (
                    <button
                      onClick={() => handleStatusUpdate(nextStatus.value)}
                      disabled={loading}
                      className="h-14 flex-1 rounded-2xl bg-zinc-950 text-base font-bold text-white transition-transform active:scale-95 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
                    >
                      {loading ? '…' : nextStatus.label}
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={loading}
                    className={`flex h-14 items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 text-sm font-semibold text-red-500 transition-transform active:scale-95 dark:border-red-900 dark:text-red-400 ${!nextStatus ? 'flex-1' : ''}`}
                  >
                    <Trash2 className="size-4" />
                    {!nextStatus && 'Xóa booking'}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900 dark:bg-red-950/20">
                  <p className="mb-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Xác nhận xóa booking của <span className="font-bold">{booking.guest?.full_name ?? 'khách'}</span>?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="h-11 flex-1 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      Không
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {loading ? '…' : 'Xóa'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>

      <EditBookingDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        booking={booking}
        rooms={rooms}
        allBookings={allBookings}
        onSuccess={() => { setEditOpen(false); onSuccess() }}
      />
    </Drawer.Root>
  )
}

interface PaymentCellProps {
  label: string
  value: number
  bold?: boolean
  highlight?: 'amber' | 'green'
}

function PaymentCell({ label, value, bold, highlight }: PaymentCellProps) {
  const valueClass = highlight === 'amber'
    ? 'text-amber-600 dark:text-amber-400'
    : highlight === 'green'
    ? 'text-emerald-600 dark:text-emerald-400'
    : bold
    ? 'text-zinc-950 dark:text-white'
    : 'text-zinc-700 dark:text-zinc-300'

  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-zinc-100 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[11px] text-zinc-400">{label}</p>
      <p className={`text-sm font-bold ${valueClass}`}>
        {value === 0 ? '—' : value.toLocaleString('vi-VN') + 'đ'}
      </p>
    </div>
  )
}
