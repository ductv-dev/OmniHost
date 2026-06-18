import { createClient } from '@/lib/supabase/server'
import GeneratorClient from './generator-client'

export default async function GeneratorPage() {
  const supabase = await createClient()

  const [buildingsResult, roomsResult, commonTemplatesResult] = await Promise.all([
    supabase
      .from('buildings')
      .select('*')
      .order('name'),
    supabase
      .from('rooms')
      .select('*')
      .order('room_number'),
    supabase
      .from('common_templates')
      .select('*')
      .order('category')
      .order('name'),
  ])

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-zinc-950 p-4 text-white dark:bg-white dark:text-zinc-950">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Quick reply
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-300 dark:text-zinc-600">
          Generate prepared replies with room data and guest details.
        </p>
      </div>

      <GeneratorClient 
        buildings={buildingsResult.data || []} 
        rooms={roomsResult.data || []} 
        commonTemplates={commonTemplatesResult.data || []}
      />
    </div>
  )
}
