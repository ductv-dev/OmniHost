'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateBookingStatus } from '../actions'
import type { BookingStatus } from '@/types/booking'

const NEXT_STATUS: Partial<Record<BookingStatus, { label: string; value: BookingStatus }>> = {
  confirmed:  { label: 'Check-in', value: 'checked_in' },
  checked_in: { label: 'Check-out', value: 'checked_out' },
}

export function BookingActions({
  bookingId,
  currentStatus,
}: {
  bookingId: string
  currentStatus: BookingStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const next = NEXT_STATUS[currentStatus]

  async function handleStatusUpdate(status: BookingStatus) {
    setLoading(true)
    setError(null)
    const result = await updateBookingStatus(bookingId, status)
    setLoading(false)
    if ('error' in result) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Primary action: progress status */}
      {next && (
        <button
          onClick={() => handleStatusUpdate(next.value)}
          disabled={loading}
          className="h-14 w-full rounded-2xl bg-zinc-950 text-base font-semibold text-white transition-transform active:scale-95 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
        >
          {loading ? 'Đang cập nhật…' : next.label}
        </button>
      )}

      {/* Cancel */}
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          disabled={loading}
          className="h-12 w-full rounded-2xl border border-red-200 text-sm font-semibold text-red-600 transition-transform active:scale-95 dark:border-red-900 dark:text-red-400"
        >
          Hủy booking
        </button>
      ) : (
        <div className="rounded-2xl border border-red-200 p-4 dark:border-red-900">
          <p className="mb-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Xác nhận hủy booking này?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="h-11 flex-1 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Không
            </button>
            <button
              onClick={() => handleStatusUpdate('cancelled')}
              disabled={loading}
              className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? '…' : 'Hủy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
