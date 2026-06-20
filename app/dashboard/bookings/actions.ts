'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { eachDayOfInterval, format, parseISO } from 'date-fns'

const bookingSchema = z.object({
  building_id: z.string().uuid('Chọn tòa nhà'),
  room_id: z.string().uuid('Chọn phòng'),
  guest_full_name: z.string().min(1, 'Tên khách là bắt buộc'),
  guest_phone: z.string().optional().or(z.literal('')),
  guest_email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  guest_country: z.string().optional().or(z.literal('')),
  source: z.enum(['airbnb', 'booking', 'agoda', 'direct', 'facebook', 'tiktok']),
  guest_type: z.enum(['short_stay', 'long_stay']),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ'),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ'),
  check_in_time: z.string().default('14:00'),
  check_out_time: z.string().default('12:00'),
  num_adults: z.number().int().min(1).default(1),
  num_children: z.number().int().min(0).default(0),
  total_price: z.number().min(0),
  deposit_paid: z.number().min(0).default(0),
  note: z.string().optional().or(z.literal('')),
})

export type CreateBookingInput = z.input<typeof bookingSchema>

export async function createBooking(
  input: CreateBookingInput
): Promise<{ bookingId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const result = bookingSchema.safeParse(input)
  if (!result.success) return { error: result.error.errors[0].message }

  const d = result.data
  if (d.check_out <= d.check_in) return { error: 'Ngày trả phòng phải sau ngày nhận phòng' }

  // Upsert guest by phone
  let guestId: string | null = null
  if (d.guest_phone) {
    const { data: existing } = await supabase
      .from('guests')
      .select('id')
      .eq('phone', d.guest_phone)
      .maybeSingle()

    if (existing) {
      guestId = existing.id
      await supabase
        .from('guests')
        .update({ full_name: d.guest_full_name, email: d.guest_email || null, country: d.guest_country || null })
        .eq('id', guestId)
    }
  }

  if (!guestId) {
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({ full_name: d.guest_full_name, phone: d.guest_phone || null, email: d.guest_email || null, country: d.guest_country || null })
      .select('id')
      .single()
    if (guestError) return { error: guestError.message }
    guestId = newGuest.id
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      building_id: d.building_id,
      room_id: d.room_id,
      guest_id: guestId,
      source: d.source,
      status: 'confirmed',
      guest_type: d.guest_type,
      check_in: d.check_in,
      check_out: d.check_out,
      check_in_time: d.check_in_time,
      check_out_time: d.check_out_time,
      num_adults: d.num_adults,
      num_children: d.num_children,
      total_price: d.total_price,
      deposit_paid: d.deposit_paid,
      note: d.note || null,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (bookingError) {
    if (bookingError.code === '23P01') return { error: 'Phòng đã được đặt trong khoảng thời gian này' }
    return { error: bookingError.message }
  }

  await supabase.from('booking_history').insert({
    booking_id: booking.id,
    action: 'created',
    changes: { status: 'confirmed', source: d.source },
    changed_by: user?.id ?? null,
  })

  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard/bookings')
  return { bookingId: booking.id }
}

export async function updateBooking(
  id: string,
  input: Partial<CreateBookingInput>
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const updateData: Record<string, unknown> = {}
  if (input.check_in) updateData.check_in = input.check_in
  if (input.check_out) updateData.check_out = input.check_out
  if (input.check_in_time) updateData.check_in_time = input.check_in_time
  if (input.check_out_time) updateData.check_out_time = input.check_out_time
  if (input.source) updateData.source = input.source
  if (input.guest_type) updateData.guest_type = input.guest_type
  if (input.num_adults !== undefined) updateData.num_adults = input.num_adults
  if (input.num_children !== undefined) updateData.num_children = input.num_children
  if (input.total_price !== undefined) updateData.total_price = input.total_price
  if (input.deposit_paid !== undefined) updateData.deposit_paid = input.deposit_paid
  if (input.note !== undefined) updateData.note = input.note || null

  if (input.check_in && input.check_out && input.check_out <= input.check_in) {
    return { error: 'Ngày trả phòng phải sau ngày nhận phòng' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('bookings').update(updateData as any).eq('id', id)
  if (error) {
    if (error.code === '23P01') return { error: 'Phòng đã được đặt trong khoảng thời gian này' }
    return { error: error.message }
  }

  await supabase.from('booking_history').insert({
    booking_id: id,
    action: 'updated',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    changes: updateData as any,
    changed_by: user?.id ?? null,
  })

  // Update guest record if any guest fields provided
  const hasGuestUpdate = input.guest_full_name || input.guest_phone !== undefined ||
    input.guest_email !== undefined || input.guest_country !== undefined
  if (hasGuestUpdate) {
    const { data: bk } = await supabase.from('bookings').select('guest_id').eq('id', id).single()
    if (bk?.guest_id) {
      const guestData: Record<string, unknown> = {}
      if (input.guest_full_name) guestData.full_name = input.guest_full_name
      if (input.guest_phone !== undefined) guestData.phone = input.guest_phone || null
      if (input.guest_email !== undefined) guestData.email = input.guest_email || null
      if (input.guest_country !== undefined) guestData.country = input.guest_country || null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('guests').update(guestData as any).eq('id', bk.guest_id)
    }
  }

  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard/bookings')
  revalidatePath(`/dashboard/bookings/${id}`)
  return { success: true }
}

export async function deleteBooking(id: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('booking_history').insert({
    booking_id: id,
    action: 'deleted',
    changes: null,
    changed_by: user?.id ?? null,
  })

  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard/bookings')
  return { success: true }
}

export async function updateBookingStatus(
  id: string,
  newStatus: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: current } = await supabase.from('bookings').select('status').eq('id', id).single()
  if (!current) return { error: 'Booking không tồn tại' }
  if (current.status === 'cancelled') return { error: 'Booking đã bị hủy' }

  const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id)
  if (error) return { error: error.message }

  await supabase.from('booking_history').insert({
    booking_id: id,
    action: newStatus === 'cancelled' ? 'cancelled' : 'updated',
    changes: { status: newStatus, previous_status: current.status },
    changed_by: user?.id ?? null,
  })

  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard/bookings')
  revalidatePath(`/dashboard/bookings/${id}`)
  return { success: true }
}

export async function createRoomBlock(input: {
  room_id: string
  start_date: string
  end_date: string
  reason?: string
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (input.end_date <= input.start_date) {
    return { error: 'Ngày kết thúc phải sau ngày bắt đầu' }
  }

  const { data, error } = await supabase
    .from('room_blocks')
    .insert({
      room_id: input.room_id,
      start_date: input.start_date,
      end_date: input.end_date,
      reason: input.reason || null,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23P01') return { error: 'Phòng đã bị khóa trong khoảng thời gian này' }
    return { error: error.message }
  }

  revalidatePath('/dashboard/calendar')
  return { id: data.id }
}

export async function deleteRoomBlock(id: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('room_blocks').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendar')
  return { success: true }
}

// ── Room Rates ──────────────────────────────────────────────────────────────

export async function upsertRoomRates(input: {
  roomIds: string[]
  startDate: string
  endDate: string
  price: number
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const dates = eachDayOfInterval({
    start: parseISO(input.startDate),
    end: parseISO(input.endDate),
  }).map((d) => format(d, 'yyyy-MM-dd'))

  const rows = input.roomIds.flatMap((roomId) =>
    dates.map((date) => ({ room_id: roomId, date, price: input.price }))
  )

  const { error } = await supabase
    .from('room_rates')
    .upsert(rows, { onConflict: 'room_id,date' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendar')
  return { success: true }
}

export async function deleteRoomRates(input: {
  roomIds: string[]
  startDate: string
  endDate: string
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const dates = eachDayOfInterval({
    start: parseISO(input.startDate),
    end: parseISO(input.endDate),
  }).map((d) => format(d, 'yyyy-MM-dd'))

  const { error } = await supabase
    .from('room_rates')
    .delete()
    .in('room_id', input.roomIds)
    .in('date', dates)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/calendar')
  return { success: true }
}
