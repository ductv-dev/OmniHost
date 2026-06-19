'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'
import { X, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { deleteBooking, updateBookingStatus } from '@/app/dashboard/bookings/actions'
import type { CalBooking, CalRoom } from './TimelineCalendar'

const STATUS_LABELS: Record<string, string> = {
  confirmed:   'Đã xác nhận',
  checked_in:  'Đang ở',
  checked_out: 'Đã trả phòng',
  cancelled:   'Đã hủy',
  no_show:     'Không đến',
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
  confirmed:  { label: 'Check-in', value: 'checked_in' },
  checked_in: { label: 'Check-out', value: 'checked_out' },
}

interface BookingDetailDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  booking: CalBooking | null
  room: CalRoom | null
  onSuccess: () => void
}

export default function BookingDetailDrawer({
  open,
  onOpenChange,
  booking,
  room,
  onSuccess,
}: BookingDetailDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!booking || !room) return null

  const nights = differenceInDays(parseISO(booking.check_out), parseISO(booking.check_in))
  const remaining = booking.total_price - booking.deposit_paid
  const nextStatus = NEXT_STATUS[booking.status]
  const canModify = booking.status !== 'cancelled' && booking.status !== 'checked_out'

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

  return (
    <Drawer.Root open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setConfirmDelete(false) }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[90dvh] flex-col rounded-t-[2rem] border-t border-white/20 bg-white/95 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900/95"
          aria-label="Chi tiết booking"
        >
          <div className="flex-shrink-0 px-5 pt-4">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="flex items-start justify-between">
              <div>
                <Drawer.Title className="text-lg font-bold text-zinc-950 dark:text-white">
                  {booking.guest?.full_name ?? 'Khách'}
                </Drawer.Title>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {room.room_number} · {SOURCE_LABELS[booking.source] ?? booking.source}
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="space-y-4 pt-4">
              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                  {error}
                </p>
              )}

              {/* Status badge */}
              <StatusChip status={booking.status} />

              {/* Dates */}
              <InfoCard>
                <Row label="Nhận phòng" value={format(parseISO(booking.check_in), 'EEE, dd/MM/yyyy')} />
                <Row label="Trả phòng" value={format(parseISO(booking.check_out), 'EEE, dd/MM/yyyy')} />
                <Row label="Số đêm" value={`${nights} đêm`} />
              </InfoCard>

              {/* Guest */}
              {booking.guest && (
                <InfoCard>
                  {booking.guest.phone && (
                    <Row label="SĐT">
                      <a href={`tel:${booking.guest.phone}`} className="font-medium text-blue-600 underline dark:text-blue-400">
                        {booking.guest.phone}
                      </a>
                    </Row>
                  )}
                  <Row label="Số người" value={`${booking.num_adults} người lớn${booking.num_children > 0 ? `, ${booking.num_children} trẻ em` : ''}`} />
                </InfoCard>
              )}

              {/* Payment */}
              <InfoCard>
                <Row label="Tổng tiền">
                  <span className="font-bold">{booking.total_price.toLocaleString('vi-VN')}đ</span>
                </Row>
                <Row label="Đã cọc" value={`${booking.deposit_paid.toLocaleString('vi-VN')}đ`} />
                <Row label="Còn lại">
                  <span className={remaining > 0 ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-emerald-600'}>
                    {remaining.toLocaleString('vi-VN')}đ
                  </span>
                </Row>
              </InfoCard>

              {/* Note */}
              {booking.note && (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <p className="mb-1 text-xs font-semibold text-zinc-400">Ghi chú</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{booking.note}</p>
                </div>
              )}

              {/* Actions */}
              {canModify && (
                <div className="space-y-2.5">
                  {/* Progress status */}
                  {nextStatus && (
                    <button
                      onClick={() => handleStatusUpdate(nextStatus.value)}
                      disabled={loading}
                      className="h-14 w-full rounded-2xl bg-zinc-950 text-base font-bold text-white transition-transform active:scale-95 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
                    >
                      {loading ? 'Đang cập nhật…' : nextStatus.label}
                    </button>
                  )}

                  {/* Cancel */}
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      disabled={loading}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 text-sm font-semibold text-red-600 transition-transform active:scale-95 dark:border-red-900 dark:text-red-400"
                    >
                      <Trash2 className="size-4" />
                      Xóa booking
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-red-200 p-4 dark:border-red-900">
                      <p className="mb-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
                        Xác nhận xóa booking này?
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
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

function StatusChip({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    confirmed:   'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    checked_in:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    checked_out: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    cancelled:   'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    no_show:     'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${colorMap[status] ?? colorMap.confirmed}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-100 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  )
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-zinc-500">{label}</span>
      {children ?? <span className="text-sm font-medium text-zinc-900 dark:text-white">{value}</span>}
    </div>
  )
}

// Keep unused import quiet
const _unused = ChevronDown
const _unused2 = Pencil
void _unused
void _unused2
