'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { X, ChevronDown } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { createBooking } from '@/app/dashboard/bookings/actions'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { CalRoom, CalBooking } from './TimelineCalendar'

const SOURCE_OPTIONS = [
  { value: 'airbnb',   label: 'Airbnb' },
  { value: 'booking',  label: 'Booking.com' },
  { value: 'agoda',    label: 'Agoda' },
  { value: 'direct',   label: 'Khách lẻ' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok',   label: 'TikTok' },
]

interface CreateBookingDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  buildingId: string
  rooms: CalRoom[]
  bookings?: CalBooking[]
  defaultRoomId: string
  defaultCheckIn: string
  onSuccess: () => void
}

export default function CreateBookingDrawer({
  open,
  onOpenChange,
  buildingId,
  rooms,
  bookings = [],
  defaultRoomId,
  defaultCheckIn,
  onSuccess,
}: CreateBookingDrawerProps) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [checkIn, setCheckIn] = useState(defaultCheckIn)
  const [checkOut, setCheckOut] = useState('')
  const [roomId, setRoomId] = useState(defaultRoomId)
  const [source, setSource] = useState('direct')
  const [guestType, setGuestType] = useState<'short_stay' | 'long_stay'>('short_stay')
  const [numAdults, setNumAdults] = useState(1)
  const [numChildren, setNumChildren] = useState(0)
  const [depositPaid, setDepositPaid] = useState(0)
  const [totalPrice, setTotalPrice] = useState<number | ''>('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when opened with new defaults
  useEffect(() => {
    if (open) {
      // Opening the dialog intentionally resets its draft from the latest defaults.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheckIn(defaultCheckIn)
      setRoomId(defaultRoomId)
      setCheckOut('')
      setFullName('')
      setPhone('')
      setEmail('')
      setCountry('')
      setSource('direct')
      setGuestType('short_stay')
      setNumAdults(1)
      setNumChildren(0)
      setDepositPaid(0)
      setTotalPrice('')
      setNote('')
      setError(null)
    }
  }, [open, defaultCheckIn, defaultRoomId])

  const selectedRoom = rooms.find(r => r.id === roomId)
  const nights = checkIn && checkOut && checkOut > checkIn
    ? differenceInDays(parseISO(checkOut), parseISO(checkIn))
    : 0

  useEffect(() => {
    if (nights > 0 && selectedRoom) {
      // Keep the editable price draft in sync when room or stay length changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTotalPrice(nights * (selectedRoom.default_price ?? 0))
    } else {
      setTotalPrice('')
    }
  }, [nights, selectedRoom])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { setError('Vui lòng nhập tên khách'); return }
    if (!checkIn || !checkOut) { setError('Vui lòng chọn ngày nhận và trả phòng'); return }
    if (checkOut <= checkIn) { setError('Ngày trả phòng phải sau ngày nhận'); return }
    if (depositPaid > (typeof totalPrice === 'number' ? totalPrice : 0)) {
      setError('Tiền cọc không được lớn hơn tổng tiền')
      return
    }

    setLoading(true)
    setError(null)
    const result = await createBooking({
      building_id: buildingId,
      room_id: roomId,
      guest_full_name: fullName.trim(),
      guest_phone: phone.trim() || undefined,
      guest_email: email.trim() || undefined,
      guest_country: country.trim() || undefined,
      source: source as 'airbnb' | 'booking' | 'agoda' | 'direct' | 'facebook' | 'tiktok',
      guest_type: guestType,
      check_in: checkIn,
      check_out: checkOut,
      num_adults: numAdults,
      num_children: numChildren,
      total_price: typeof totalPrice === 'number' ? totalPrice : 0,
      deposit_paid: depositPaid,
      note: note.trim() || undefined,
    })
    setLoading(false)

    if ('error' in result) {
      setError(result.error)
    } else {
      onOpenChange(false)
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-white/95 p-0 backdrop-blur-3xl dark:bg-zinc-900/95 sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl sm:border"
          aria-label="Đặt phòng"
        >
          <div className="flex-shrink-0 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-zinc-950 dark:text-white">
                Đặt phòng mới
              </DialogTitle>
              <button
                onClick={() => onOpenChange(false)}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="space-y-4">
              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                  {error}
                </p>
              )}

              {/* Guest info */}
              <Section title="Thông tin khách">
                <Field label="Họ tên *">
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className={inputClass}
                    required
                  />
                </Field>
                <Field label="Số điện thoại">
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+84 901 234 567"
                    type="tel"
                    className={inputClass}
                  />
                </Field>
                <Field label="Email">
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="guest@email.com"
                    type="email"
                    className={inputClass}
                  />
                </Field>
                <Field label="Quốc tịch">
                  <input
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="Vietnam"
                    className={inputClass}
                  />
                </Field>
              </Section>

              {/* Dates + Room */}
              <Section title="Phòng & ngày">
                <Field label="Phòng">
                  <div className="relative">
                    <select
                      value={roomId}
                      onChange={e => setRoomId(e.target.value)}
                      className={selectClass}
                    >
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>{r.room_number}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                  </div>
                </Field>
                <Field label="Ngày nhận → trả phòng">
                  <DateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    bookings={bookings.filter(b => b.room_id === roomId)}
                    onChangeCheckIn={setCheckIn}
                    onChangeCheckOut={setCheckOut}
                  />
                </Field>
              </Section>

              {/* Booking details */}
              <Section title="Chi tiết đặt phòng">
                <Field label="Nguồn">
                  <div className="relative">
                    <select
                      value={source}
                      onChange={e => setSource(e.target.value)}
                      className={selectClass}
                    >
                      {SOURCE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                  </div>
                </Field>
                <Field label="Loại lưu trú">
                  <div className="grid grid-cols-2 gap-2">
                    {(['short_stay', 'long_stay'] as const).map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setGuestType(v)}
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
                    <input
                      value={numAdults}
                      onChange={e => setNumAdults(Number(e.target.value))}
                      type="number"
                      min={1}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Trẻ em">
                    <input
                      value={numChildren}
                      onChange={e => setNumChildren(Number(e.target.value))}
                      type="number"
                      min={0}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Thanh toán">
                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-500">
                      {nights > 0 ? `${nights} đêm × ${(selectedRoom?.default_price ?? 0).toLocaleString('vi-VN')}đ` : 'Tổng tiền'}
                    </span>
                    <div className="relative">
                      <input
                        type="number"
                        value={totalPrice}
                        onChange={e => setTotalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-32 rounded-lg border-0 bg-white px-3 py-1.5 pr-6 text-right font-bold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-zinc-900"
                        min={0}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400">đ</span>
                    </div>
                  </div>
                </div>
                <Field label="Đặt cọc (đ)">
                  <input
                    value={depositPaid}
                    onChange={e => setDepositPaid(Number(e.target.value))}
                    type="number"
                    min={0}
                    className={inputClass}
                  />
                </Field>
              </Section>

              {/* Note */}
              <Section title="Ghi chú">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ghi chú thêm..."
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </Section>

              <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-zinc-950 text-base font-bold text-white transition-transform active:scale-95 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
                >
                  {loading ? 'Đang lưu…' : 'Xác nhận đặt phòng'}
                </button>
              </div>
            </div>
            </div>
          </form>
        </DialogContent>
    </Dialog>
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
