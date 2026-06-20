'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'
import { Calendar } from '@/components/ui/calendar'
import { differenceInDays, parseISO, format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { CalendarDays } from 'lucide-react'

import type { CalBooking } from '@/components/calendar/TimelineCalendar'

interface DateRangePickerProps {
  checkIn: string
  checkOut: string
  bookings?: CalBooking[]
  onChangeCheckIn: (v: string) => void
  onChangeCheckOut: (v: string) => void
}

function toDate(s: string): Date | undefined {
  return s ? parseISO(s) : undefined
}

function fmt(s: string) {
  if (!s) return null
  const d = parseISO(s)
  return format(d, 'dd/MM', { locale: vi })
}

export function DateRangePicker({
  checkIn,
  checkOut,
  bookings = [],
  onChangeCheckIn,
  onChangeCheckOut,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: toDate(checkIn),
    to: toDate(checkOut),
  }))

  function handleOpen() {
    setRange({ from: toDate(checkIn), to: toDate(checkOut) })
    setOpen(true)
  }

  function handleSelect(r: DateRange | undefined) {
    setRange(r)
  }

  function handleConfirm() {
    if (range?.from) onChangeCheckIn(format(range.from, 'yyyy-MM-dd'))
    if (range?.to) onChangeCheckOut(format(range.to, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const nights =
    range?.from && range?.to
      ? differenceInDays(range.to, range.from)
      : 0

  const hasRange = nights > 0

  return (
    <>
      {/* Trigger — 2 ô ngày */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm transition-colors active:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <CalendarDays className="size-4 shrink-0 text-zinc-400" />
        <div className="flex flex-1 items-center gap-2">
          <span className={checkIn ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-400'}>
            {fmt(checkIn) ?? 'Nhận phòng'}
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">→</span>
          <span className={checkOut ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-400'}>
            {fmt(checkOut) ?? 'Trả phòng'}
          </span>
          {checkIn && checkOut && checkOut > checkIn && (
            <span className="ml-auto rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800">
              {differenceInDays(parseISO(checkOut), parseISO(checkIn))} đêm
            </span>
          )}
        </div>
      </button>

      {/* Nested Drawer — Calendar */}
      <Drawer.NestedRoot open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[60] flex max-h-[92svh] flex-col rounded-t-[2rem] border-t border-white/20 bg-white shadow-2xl dark:bg-zinc-950">
            {/* Header */}
            <div className="shrink-0 px-5 pt-4 pb-3">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <Drawer.Title className="text-base font-bold">Chọn ngày</Drawer.Title>
              {hasRange ? (
                <p className="mt-0.5 text-sm text-zinc-500">
                  {fmt(format(range!.from!, 'yyyy-MM-dd'))} → {fmt(format(range!.to!, 'yyyy-MM-dd'))} · <span className="font-semibold text-zinc-800 dark:text-zinc-200">{nights} đêm</span>
                </p>
              ) : range?.from ? (
                <p className="mt-0.5 text-sm text-zinc-500">
                  Nhận: {fmt(format(range.from, 'yyyy-MM-dd'))} · Chọn ngày trả phòng
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-zinc-400">Chọn ngày nhận phòng</p>
              )}
            </div>

            {/* Calendar */}
            <div className="flex-1 overflow-y-auto flex items-start justify-center px-2 pb-2">
              <Calendar
                mode="range"
                selected={range}
                onSelect={handleSelect}
                disabled={(date: Date) => {
                  const dStr = format(date, 'yyyy-MM-dd')
                  
                  if (range?.from && !range?.to) {
                    const fromStr = format(range.from, 'yyyy-MM-dd')
                    let nextBookingStart: string | null = null
                    for (const b of bookings) {
                      if (b.check_in >= fromStr) {
                        if (!nextBookingStart || b.check_in < nextBookingStart) {
                          nextBookingStart = b.check_in
                        }
                      }
                    }
                    if (nextBookingStart && dStr > nextBookingStart) return true
                  }
                  
                  let hasCheckIn = false
                  let hasCheckOut = false
                  for (const b of bookings) {
                    if (dStr > b.check_in && dStr < b.check_out) return true
                    if (dStr === b.check_in) hasCheckIn = true
                    if (dStr === b.check_out) hasCheckOut = true
                  }
                  if (hasCheckIn && hasCheckOut) return true
                  
                  return false
                }}
                numberOfMonths={1}
                locale={vi}
                classNames={{
                  root: 'w-full',
                  month_grid: 'w-full',
                  weekday: 'flex-1 text-center text-xs text-zinc-400 py-1',
                  week: 'flex w-full',
                  day: 'flex-1 text-center',
                }}
              />
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-zinc-100 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!hasRange}
                className="h-14 w-full rounded-2xl bg-zinc-950 text-base font-bold text-white transition-transform active:scale-95 disabled:opacity-40 dark:bg-white dark:text-zinc-950"
              >
                {hasRange ? `Xác nhận · ${nights} đêm` : 'Chọn ngày trả phòng'}
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.NestedRoot>
    </>
  )
}
