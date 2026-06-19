'use server'

import { revalidatePath } from 'next/cache'
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
  default_price: z.coerce.number().min(0).optional(),
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
    default_price: formData.get('default_price'),
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
      default_price: result.data.default_price ?? 0,
    },
  ])

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/buildings/${data.building_id}`)
  return { success: true }
}

export async function updateRoom(id: string, formData: FormData) {
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
    default_price: formData.get('default_price'),
  }

  const result = roomSchema.safeParse(data)

  if (!result.success) {
    return { error: 'Validation failed', details: result.error.flatten() }
  }

  const { error } = await supabase
    .from('rooms')
    .update({
      ...result.data,
      lockbox_password: result.data.lockbox_password || null,
      wifi_name: result.data.wifi_name || null,
      wifi_password: result.data.wifi_password || null,
      washing_machine_floor: result.data.washing_machine_floor ?? null,
      dryer_floor: result.data.dryer_floor ?? null,
      room_note: result.data.room_note || null,
      default_price: result.data.default_price ?? 0,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/buildings/${data.building_id}`)
  return { success: true }
}

export async function deleteRoom(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('rooms').delete().eq('id', id)
  
  if (error) return { error: error.message }

  // revalidatePath is harder without knowing the building_id here, but we can just let the client handle it via reload
  return { success: true }
}

export async function createBulkRooms(buildingId: string, roomsData: { room_number: string; floor: number; default_price?: number }[]) {
  if (!roomsData || roomsData.length === 0) return { error: 'No rooms provided' }
  const supabase = await createClient()

  const insertPayload = roomsData.map(r => ({
    building_id: buildingId,
    room_number: r.room_number,
    floor: r.floor,
    default_price: r.default_price ?? 0,
  }))

  const { error } = await supabase.from('rooms').insert(insertPayload)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/buildings/${buildingId}`)
  return { success: true }
}
