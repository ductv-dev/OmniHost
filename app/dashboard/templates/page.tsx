import { createClient } from '@/lib/supabase/server'
import TemplatesClient from './templates-client'

export default async function CommonTemplatesPage() {
  const supabase = await createClient()
  const { data: templates } = await supabase
    .from('common_templates')
    .select('*')
    .order('category')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Common Templates</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create reusable messages that do not belong to any building or room.
        </p>
      </div>

      <TemplatesClient initialTemplates={templates || []} />
    </div>
  )
}
