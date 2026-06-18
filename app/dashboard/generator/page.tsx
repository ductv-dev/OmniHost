import { createClient } from '@/lib/supabase/server'
import GeneratorClient from './generator-client'

export default async function GeneratorPage() {
  const supabase = await createClient()

  // Fetch all buildings and rooms
  const { data: buildings } = await supabase
    .from('buildings')
    .select('*')
    .order('name')

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('room_number')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Generate prepared replies with room data and guest details.
        </p>
      </div>

      <GeneratorClient 
        buildings={buildings || []} 
        rooms={rooms || []} 
      />
    </div>
  )
}
