'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createMessageFlow(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const items = formData.get('items') as string

  if (!name) return { error: 'Tên luồng không được để trống.' }

  let parsedItems
  try {
    parsedItems = JSON.parse(items || '[]')
  } catch {
    return { error: 'Dữ liệu template không hợp lệ.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('message_flows')
    .insert({ name, items: parsedItems })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/generator')
  return { success: true, data }
}

export async function updateMessageFlow(id: string, formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const items = formData.get('items') as string

  if (!name) return { error: 'Tên luồng không được để trống.' }

  let parsedItems
  try {
    parsedItems = JSON.parse(items || '[]')
  } catch {
    return { error: 'Dữ liệu template không hợp lệ.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('message_flows')
    .update({ name, items: parsedItems })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/generator')
  return { success: true, data }
}

export async function deleteMessageFlow(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('message_flows')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/generator')
  return { success: true }
}
