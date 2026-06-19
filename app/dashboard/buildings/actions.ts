'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { defaultTemplates, normalizeMessageTemplates } from '@/lib/constants/templates'
import { Json, TablesUpdate } from '@/types/supabase'

const buildingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sign_name: z.string().optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  map_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  gate_password: z.string().optional().or(z.literal('')),
  lobby_wifi_name: z.string().optional().or(z.literal('')),
  lobby_wifi_password: z.string().optional().or(z.literal('')),
  drinking_water_note: z.string().optional().or(z.literal('')),
  motorbike_parking_note: z.string().optional().or(z.literal('')),
  custom_templates: z.string().optional().transform((val) => {
    if (!val) return defaultTemplates;
    try {
      return JSON.parse(val);
    } catch {
      return defaultTemplates;
    }
  })
})

export async function createBuilding(formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    sign_name: (formData.get('sign_name') as string | null) ?? undefined,
    address: formData.get('address') as string,
    // Convert null → undefined so Zod .optional() works correctly
    map_link: (formData.get('map_link') as string | null) ?? undefined,
    gate_password: (formData.get('gate_password') as string | null) ?? undefined,
    lobby_wifi_name: (formData.get('lobby_wifi_name') as string | null) ?? undefined,
    lobby_wifi_password: (formData.get('lobby_wifi_password') as string | null) ?? undefined,
    drinking_water_note: (formData.get('drinking_water_note') as string | null) ?? undefined,
    motorbike_parking_note: (formData.get('motorbike_parking_note') as string | null) ?? undefined,
    custom_templates: (formData.get('custom_templates') as string | null) ?? undefined,
  }

  const result = buildingSchema.safeParse(data)

  if (!result.success) {
    return { error: 'Validation failed', details: result.error.flatten() }
  }

  const { error } = await supabase.from('buildings').insert([
    {
      name: result.data.name,
      sign_name: result.data.sign_name || null,
      address: result.data.address,
      map_link: result.data.map_link || null,
      gate_password: result.data.gate_password || null,
      lobby_wifi_name: result.data.lobby_wifi_name || null,
      lobby_wifi_password: result.data.lobby_wifi_password || null,
      drinking_water_note: result.data.drinking_water_note || null,
      motorbike_parking_note: result.data.motorbike_parking_note || null,
      custom_templates: result.data.custom_templates,
    },
  ])

  if (error) {
    console.error('[createBuilding] Supabase error:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/buildings')
  redirect('/dashboard/buildings')
}

export async function createBuildingInline(input: {
  name: string
  sign_name?: string
  address: string
  map_link?: string
  gate_password?: string
  lobby_wifi_name?: string
  lobby_wifi_password?: string
  drinking_water_note?: string
  motorbike_parking_note?: string
}): Promise<{ success: true } | { error: string }> {
  if (!input.name?.trim()) return { error: 'Nhập tên tòa nhà' }
  if (!input.address?.trim()) return { error: 'Nhập địa chỉ' }

  const supabase = await createClient()
  const { error } = await supabase.from('buildings').insert([{
    name: input.name.trim(),
    sign_name: input.sign_name?.trim() || null,
    address: input.address.trim(),
    map_link: input.map_link?.trim() || null,
    gate_password: input.gate_password?.trim() || null,
    lobby_wifi_name: input.lobby_wifi_name?.trim() || null,
    lobby_wifi_password: input.lobby_wifi_password?.trim() || null,
    drinking_water_note: input.drinking_water_note?.trim() || null,
    motorbike_parking_note: input.motorbike_parking_note?.trim() || null,
    custom_templates: defaultTemplates,
  }])

  if (error) return { error: error.message }

  revalidatePath('/dashboard/buildings')
  return { success: true }
}

export async function updateBuilding(id: string, formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    sign_name: (formData.get('sign_name') as string | null) ?? undefined,
    address: formData.get('address') as string,
    // Convert null → undefined so Zod .optional() works correctly
    map_link: (formData.get('map_link') as string | null) ?? undefined,
    gate_password: (formData.get('gate_password') as string | null) ?? undefined,
    lobby_wifi_name: (formData.get('lobby_wifi_name') as string | null) ?? undefined,
    lobby_wifi_password: (formData.get('lobby_wifi_password') as string | null) ?? undefined,
    drinking_water_note: (formData.get('drinking_water_note') as string | null) ?? undefined,
    motorbike_parking_note: (formData.get('motorbike_parking_note') as string | null) ?? undefined,
    custom_templates: (formData.get('custom_templates') as string | null) ?? undefined,
  }

  const result = buildingSchema.safeParse(data)

  if (!result.success) {
    return { error: 'Validation failed', details: result.error.flatten() }
  }

  const updatePayload: TablesUpdate<'buildings'> = {
    name: result.data.name,
    sign_name: result.data.sign_name || null,
    address: result.data.address,
    map_link: result.data.map_link || null,
    gate_password: result.data.gate_password || null,
    lobby_wifi_name: result.data.lobby_wifi_name || null,
    lobby_wifi_password: result.data.lobby_wifi_password || null,
    drinking_water_note: result.data.drinking_water_note || null,
    motorbike_parking_note: result.data.motorbike_parking_note || null,
    custom_templates: result.data.custom_templates,
  }

  const { error } = await supabase
    .from('buildings')
    .update(updatePayload)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/buildings')
  redirect('/dashboard/buildings')
}

export async function updateBuildingTemplates(id: string, formData: FormData) {
  const supabase = await createClient()
  const templates = normalizeMessageTemplates(formData.get('custom_templates'))

  if (templates.length === 0) {
    return { error: 'Please add at least one valid template.' }
  }

  const { error } = await supabase
    .from('buildings')
    .update({ custom_templates: templates as unknown as Json })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/buildings/${id}`)
  revalidatePath('/dashboard/generator')
  return { success: true }
}

export async function deleteBuilding(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('buildings')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/buildings')
}
