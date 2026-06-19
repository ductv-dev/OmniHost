'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTemplateSyntaxIssues } from '@/lib/constants/templates'
import { z } from 'zod'

const templateSchema = z.object({
  name: z.string().trim().min(1, 'Template name is required'),
  category: z.string().trim().min(1, 'Category is required'),
  content: z.string().trim().min(1, 'Message content is required'),
})

function readTemplateForm(formData: FormData) {
  return {
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    content: formData.get('content') as string,
  }
}

function validateTemplate(formData: FormData) {
  const result = templateSchema.safeParse(readTemplateForm(formData))

  if (!result.success) {
    return {
      error: 'Validation failed',
      details: result.error.flatten(),
    }
  }

  const syntaxIssues = getTemplateSyntaxIssues(result.data.content)
  if (syntaxIssues.length > 0) {
    return { error: syntaxIssues.join(' ') }
  }

  return { data: result.data }
}

export async function createCommonTemplate(formData: FormData) {
  const validated = validateTemplate(formData)
  if ('error' in validated) return validated

  const supabase = await createClient()
  const { error } = await supabase
    .from('common_templates')
    .insert(validated.data)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/templates')
  revalidatePath('/dashboard/generator')
  return { success: true }
}

export async function updateCommonTemplate(id: string, formData: FormData) {
  const validated = validateTemplate(formData)
  if ('error' in validated) return validated

  const supabase = await createClient()
  const { error } = await supabase
    .from('common_templates')
    .update(validated.data)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/templates')
  revalidatePath('/dashboard/generator')
  return { success: true }
}

export async function createCommonTemplateInline(input: {
  name: string
  category: string
  content: string
}): Promise<{ id: string; name: string; category: string; content: string; created_at: string } | { error: string }> {
  if (!input.name.trim()) return { error: 'Nhập tên template' }
  if (!input.category.trim()) return { error: 'Nhập danh mục' }
  if (!input.content.trim()) return { error: 'Nhập nội dung' }

  const syntaxIssues = getTemplateSyntaxIssues(input.content.trim())
  if (syntaxIssues.length > 0) return { error: syntaxIssues.join(' ') }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('common_templates')
    .insert({ name: input.name.trim(), category: input.category.trim(), content: input.content.trim() })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/templates')
  revalidatePath('/dashboard/generator')
  return data as { id: string; name: string; category: string; content: string; created_at: string }
}

export async function deleteCommonTemplate(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('common_templates')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/templates')
  revalidatePath('/dashboard/generator')
  return { success: true }
}
