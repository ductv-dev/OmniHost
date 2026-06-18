import { createClient } from '@/lib/supabase/server'
import RoomForm from './room-form'

export default async function NewRoomPage() {
  const supabase = await createClient()
  const { data: buildings } = await supabase.from('buildings').select('id, name')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Room</h1>
        <p className="text-muted-foreground">Create a new room in a building.</p>
      </div>
      
      <RoomForm buildings={buildings || []} />
    </div>
  )
}
