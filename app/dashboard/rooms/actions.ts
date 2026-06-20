'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const optionalFloorSchema = z.preprocess(
  value => (value === '' || value === null ? undefined : value),
  z.coerce.number().int().min(0).optional()
)

const roomSchema = z.object({
  building_id: z.string().uuid('Invalid building ID'),
  room_number: z.string().min(1, 'Room number is required'),
  floor: z.coerce.number().int().min(0, 'Floor must be a positive integer'),
  lockbox_password: z.string().optional().or(z.literal('')),
  wifi_name: z.string().optional().or(z.literal('')),
  wifi_password: z.string().optional().or(z.literal('')),
  washing_machine_floor: optionalFloorSchema,
  dryer_floor: optionalFloorSchema,
  room_note: z.string().optional().or(z.literal('')),
})

const bulkRoomSchema = z.object({
  building_id: z.string().uuid('Invalid building ID'),
  prefix: z.string().min(1, 'Prefix is required').max(10),
  start_floor: z.coerce.number().int().min(1),
  num_floors: z.coerce.number().int().min(1).max(50),
  rooms_per_floor: z.coerce.number().int().min(1).max(50),
  default_price: z.coerce.number().int().min(0).default(0),
  lockbox_password: z.string().optional().or(z.literal('')),
  wifi_password: z.string().optional().or(z.literal('')),
  washing_machine_floor: optionalFloorSchema,
  dryer_floor: optionalFloorSchema,
  room_note: z.string().optional().or(z.literal('')),
})

export async function createRoom(formData: FormData) {
  const supabase = await createClient()

  const data = {
    building_id: formData.get('building_id') as string,
    room_number: formData.get('room_number') as string,
    floor: formData.get('floor'),
    lockbox_password: formData.get('lockbox_password') as string,
    wifi_name: formData.get('wifi_name') as string,
    wifi_password: formData.get('wifi_password') as string,
    washing_machine_floor: formData.get('washing_machine_floor') as string,
    dryer_floor: formData.get('dryer_floor') as string,
    room_note: formData.get('room_note') as string,
  }

  const result = roomSchema.safeParse(data)

  if (!result.success) {
    return { error: 'Validation failed', details: result.error.flatten() }
  }

  const { error } = await supabase.from('rooms').insert([
    {
      ...result.data,
      lockbox_password: result.data.lockbox_password || null,
      wifi_name: result.data.wifi_name || null,
      wifi_password: result.data.wifi_password || null,
      washing_machine_floor: result.data.washing_machine_floor ?? null,
      dryer_floor: result.data.dryer_floor ?? null,
      room_note: result.data.room_note || null,
    },
  ])

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/rooms')
  redirect('/dashboard/rooms')
}

export async function createRoomsBulk(input: {
  building_id: string
  prefix: string
  start_floor: number
  num_floors: number
  rooms_per_floor: number
  default_price: number
  lockbox_password?: string
  wifi_password?: string
  washing_machine_floor?: number
  dryer_floor?: number
  room_note?: string
}) {
  const supabase = await createClient()

  const result = bulkRoomSchema.safeParse(input)
  if (!result.success) {
    return { error: 'Validation failed', details: result.error.flatten() }
  }

  const d = result.data
  const rooms = []

  for (let f = d.start_floor; f < d.start_floor + d.num_floors; f++) {
    for (let r = 1; r <= d.rooms_per_floor; r++) {
      const roomNum = `${f}${String(r).padStart(2, '0')}`
      rooms.push({
        building_id: d.building_id,
        room_number: roomNum,
        floor: f,
        default_price: d.default_price,
        wifi_name: d.prefix ? `${d.prefix}${roomNum}` : null,
        wifi_password: d.wifi_password || null,
        lockbox_password: d.lockbox_password || null,
        washing_machine_floor: d.washing_machine_floor ?? null,
        dryer_floor: d.dryer_floor ?? null,
        room_note: d.room_note || null,
      })
    }
  }

  const { error } = await supabase.from('rooms').insert(rooms)
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/rooms')
  redirect('/dashboard/rooms')
}
