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
    <div className="space-y-4">
      <div className="rounded-lg bg-zinc-950 p-4 text-white dark:bg-white dark:text-zinc-950">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Reusable replies
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-300 dark:text-zinc-600">
          Create reusable messages that do not belong to any building or room.
        </p>
      </div>

      <TemplatesClient initialTemplates={templates || []} />
    </div>
  )
}
