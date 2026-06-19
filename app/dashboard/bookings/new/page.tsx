import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BookingForm from '@/components/booking/BookingForm'
import type { BuildingForBooking } from '@/types/booking'

export default async function NewBookingPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('buildings')
    .select(`
      id, name,
      rooms(id, building_id, room_number, floor, default_price, is_active)
    `)
    .order('name')

  const buildings = (data ?? []) as unknown as BuildingForBooking[]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/bookings"
          className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-transform active:scale-95 dark:bg-zinc-800"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Booking mới</h1>
          <p className="text-xs text-zinc-500">Điền thông tin để tạo đặt phòng</p>
        </div>
      </div>

      <BookingForm buildings={buildings} />
    </div>
  )
}
