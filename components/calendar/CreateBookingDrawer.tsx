'use client'

import { useState, useEffect } from 'react'
import { Drawer } from 'vaul'
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
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when opened with new defaults
  useEffect(() => {
    if (open) {
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
      setNote('')
      setError(null)
    }
  }, [open, defaultCheckIn, defaultRoomId])

  const selectedRoom = rooms.find(r => r.id === roomId)
  const nights = checkIn && checkOut && checkOut > checkIn
    ? differenceInDays(parseISO(checkOut), parseISO(checkIn))
    : 0
  const totalPrice = nights * (selectedRoom?.default_price ?? 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { setError('Vui lòng nhập tên khách'); return }
    if (!checkIn || !checkOut) { setError('Vui lòng chọn ngày nhận và trả phòng'); return }
    if (checkOut <= checkIn) { setError('Ngày trả phòng phải sau ngày nhận'); return }

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
      total_price: totalPrice,
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
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[2rem] border-t border-white/20 bg-white/95 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900/95"
          aria-label="Đặt phòng"
        >
          <div className="flex-shrink-0 px-5 pt-4">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="flex items-center justify-between">
              <Drawer.Title className="text-lg font-bold text-zinc-950 dark:text-white">
                Đặt phòng mới
              </Drawer.Title>
              <button
                onClick={() => onOpenChange(false)}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-5 py-4">
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

              {/* Pricing */}
              <Section title="Thanh toán">
                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">
                      {nights > 0 ? `${nights} đêm × ${(selectedRoom?.default_price ?? 0).toLocaleString('vi-VN')}đ` : 'Chọn ngày để tính giá'}
                    </span>
                    <span className="text-base font-bold text-zinc-950 dark:text-white">
                      {totalPrice.toLocaleString('vi-VN')}đ
                    </span>
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

            </div>
            </div>

            <div className="shrink-0 border-t border-zinc-100 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 dark:border-zinc-800">
              <button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-zinc-950 text-base font-bold text-white transition-transform active:scale-95 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
              >
                {loading ? 'Đang lưu…' : 'Xác nhận đặt phòng'}
              </button>
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
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
