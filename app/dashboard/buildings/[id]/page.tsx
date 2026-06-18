import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BuildingHubClient from './hub-client'

export default async function BuildingHubPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params
  
  // Fetch Building
  const { data: building } = await supabase
    .from('buildings')
    .select('*')
    .eq('id', id)
    .single()
    
  if (!building) {
    notFound()
  }

  // Fetch Rooms
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('building_id', id)
    .order('room_number', { ascending: true })

  return <BuildingHubClient building={building} rooms={rooms || []} />
}
