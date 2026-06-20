'use client'

import { updateBooking } from '@/app/dashboard/bookings/actions'
import SourceIcon from '@/components/booking/SourceIcon'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { BookingSource } from '@/types/booking'
import { differenceInDays, parseISO } from 'date-fns'
import { ChevronDown, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Drawer } from 'vaul'
import type { CalBooking, CalRoom } from './TimelineCalendar'

const SOURCE_OPTIONS = [
  { value: 'direct',   label: 'Khách lẻ' },
  { value: 'airbnb',   label: 'Airbnb' },
  { value: 'booking',  label: 'Booking.com' },
  { value: 'agoda',    label: 'Agoda' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok',   label: 'TikTok' },
]

const STATUS_OPTIONS = [
  { value: 'confirmed',   label: 'Đã xác nhận' },
  { value: 'checked_in',  label: 'Đang ở' },
  { value: 'checked_out', label: 'Đã trả phòng' },
  { value: 'cancelled',   label: 'Đã hủy' },
  { value: 'no_show',     label: 'Không đến' },
]

interface EditBookingDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  booking: CalBooking
  rooms: CalRoom[]
  allBookings: CalBooking[]
  onSuccess: () => void
}

export default function EditBookingDrawer({
  open,
  onOpenChange,
  booking,
  rooms,
  allBookings,
  onSuccess,
}: EditBookingDrawerProps) {
  const [fullName, setFullName] = useState(booking.guest?.full_name ?? '')
  const [phone, setPhone] = useState(booking.guest?.phone ?? '')
  const [email, setEmail] = useState(booking.guest?.email ?? '')
  const [country, setCountry] = useState(booking.guest?.country ?? '')
  const [checkIn, setCheckIn] = useState(booking.check_in)
  const [checkOut, setCheckOut] = useState(booking.check_out)
  const [source, setSource] = useState(booking.source)
  const [status, setStatus] = useState(booking.status)
  const [guestType, setGuestType] = useState<'short_stay' | 'long_stay'>(
    booking.guest_type === 'long_stay' ? 'long_stay' : 'short_stay'
  )
  const [numAdults, setNumAdults] = useState(booking.num_adults)
  const [numChildren, setNumChildren] = useState(booking.num_children)
  const [totalPrice, setTotalPrice] = useState<number | ''>(booking.total_price)
  const [depositPaid, setDepositPaid] = useState(booking.deposit_paid)
  const [note, setNote] = useState(booking.note ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync from booking prop when drawer opens
  useEffect(() => {
    if (open) {
      setFullName(booking.guest?.full_name ?? '')
      setPhone(booking.guest?.phone ?? '')
      setEmail(booking.guest?.email ?? '')
      setCountry(booking.guest?.country ?? '')
      setCheckIn(booking.check_in)
      setCheckOut(booking.check_out)
      setSource(booking.source)
      setStatus(booking.status)
      setGuestType(booking.guest_type === 'long_stay' ? 'long_stay' : 'short_stay')
      setNumAdults(booking.num_adults)
      setNumChildren(booking.num_children)
      setTotalPrice(booking.total_price)
      setDepositPaid(booking.deposit_paid)
      setNote(booking.note ?? '')
      setError(null)
    }
  }, [open, booking])

  // Recalculate price when dates change
  const selectedRoom = rooms.find(r => r.id === booking.room_id)
  useEffect(() => {
    if (checkIn && checkOut && checkOut > checkIn && selectedRoom) {
      const nights = differenceInDays(parseISO(checkOut), parseISO(checkIn))
      setTotalPrice(nights * (selectedRoom.default_price ?? 0))
    }
  }, [checkIn, checkOut, selectedRoom?.id, selectedRoom?.default_price])

  async function handleSave() {
    if (!fullName.trim()) { setError('Vui lòng nhập tên khách'); return }
    if (!checkIn || !checkOut) { setError('Vui lòng chọn ngày'); return }
    if (checkOut <= checkIn) { setError('Ngày trả phòng phải sau ngày nhận'); return }

    setLoading(true)
    setError(null)
    const result = await updateBooking(booking.id, {
      check_in: checkIn,
      check_out: checkOut,
      source: source as BookingSource,
      guest_type: guestType,
      num_adults: numAdults,
      num_children: numChildren,
      total_price: typeof totalPrice === 'number' ? totalPrice : 0,
      deposit_paid: depositPaid,
      note: note.trim() || undefined,
      guest_full_name: fullName.trim(),
      guest_phone: phone.trim() || undefined,
      guest_email: email.trim() || undefined,
      guest_country: country.trim() || undefined,
    })
    // Update status separately if changed
    if ('success' in result && status !== booking.status) {
      const { updateBookingStatus } = await import('@/app/dashboard/bookings/actions')
      await updateBookingStatus(booking.id, status as Parameters<typeof updateBookingStatus>[1])
    }
    setLoading(false)

    if ('error' in result) {
      setError(result.error)
    } else {
      onOpenChange(false)
      onSuccess()
    }
  }

  // Bookings for conflict check — exclude current booking
  const otherBookings = allBookings.filter(b => b.id !== booking.id && b.room_id === booking.room_id)

  return (
    <Drawer.NestedRoot open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-60 bg-black/20 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-60 flex max-h-[92dvh] flex-col rounded-t-[2rem] border-t border-white/20 bg-white/95 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900/95"
          aria-label="Sửa booking"
        >
          <div className="shrink-0 px-5 pt-4">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="flex items-center justify-between">
              <Drawer.Title className="text-lg font-bold text-zinc-950 dark:text-white">
                Sửa booking
              </Drawer.Title>
              <button
                onClick={() => onOpenChange(false)}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="space-y-5">
              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                  {error}
                </p>
              )}

              {/* Guest */}
              <Section title="Thông tin khách">
                <Field label="Họ tên *">
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A" className={inputClass} />
                </Field>
                <Field label="Số điện thoại">
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    type="tel" placeholder="+84 901 234 567" className={inputClass} />
                </Field>
                <Field label="Email">
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    type="email" placeholder="guest@email.com" className={inputClass} />
                </Field>
                <Field label="Quốc tịch">
                  <input value={country} onChange={e => setCountry(e.target.value)}
                    placeholder="Vietnam" className={inputClass} />
                </Field>
              </Section>

              {/* Dates */}
              <Section title="Ngày lưu trú">
                <Field label="Nhận phòng → Trả phòng">
                  <DateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    bookings={otherBookings}
                    onChangeCheckIn={setCheckIn}
                    onChangeCheckOut={setCheckOut}
                  />
                </Field>
              </Section>

              {/* Details */}
              <Section title="Chi tiết">
                <Field label="Nguồn">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                      <SourceIcon source={source as BookingSource} size={14} />
                    </span>
                    <select value={source} onChange={e => setSource(e.target.value)}
                      className={`${selectClass} pl-9`}>
                      {SOURCE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                  </div>
                </Field>
                <Field label="Trạng thái">
                  <div className="relative">
                    <select value={status} onChange={e => setStatus(e.target.value)}
                      className={selectClass}>
                      {STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                  </div>
                </Field>
                <Field label="Loại lưu trú">
                  <div className="grid grid-cols-2 gap-2">
                    {(['short_stay', 'long_stay'] as const).map(v => (
                      <button key={v} type="button" onClick={() => setGuestType(v)}
                        className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                          guestType === v
                            ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {v === 'short_stay' ? 'Ngắn ngày' : 'Dài ngày'}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Người lớn">
                    <input value={numAdults} onChange={e => setNumAdults(Number(e.target.value))}
                      type="number" min={1} className={inputClass} />
                  </Field>
                  <Field label="Trẻ em">
                    <input value={numChildren} onChange={e => setNumChildren(Number(e.target.value))}
                      type="number" min={0} className={inputClass} />
                  </Field>
                </div>
              </Section>

              {/* Payment */}
              <Section title="Thanh toán">
                <Field label="Tổng tiền (đ)">
                  <input value={totalPrice} onChange={e => setTotalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    type="number" min={0} className={inputClass} />
                </Field>
                <Field label="Đã cọc (đ)">
                  <input value={depositPaid} onChange={e => setDepositPaid(Number(e.target.value))}
                    type="number" min={0} className={inputClass} />
                </Field>
              </Section>

              {/* Note */}
              <Section title="Ghi chú">
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Ghi chú thêm..." rows={3}
                  className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </Section>

              <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-zinc-950 text-base font-bold text-white transition-transform active:scale-95 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
                >
                  {loading ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  )
}

const inputClass =
  'w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900'

const selectClass =
  'w-full appearance-none rounded-2xl border border-zinc-200 bg-white py-3 pl-4 pr-10 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="px-1 text-xs font-semibold text-zinc-500">{label}</label>
      {children}
    </div>
  )
}
