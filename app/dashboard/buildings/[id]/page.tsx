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
  
  const [buildingResult, roomsResult] = await Promise.all([
    supabase
      .from('buildings')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('rooms')
      .select('*')
      .eq('building_id', id)
      .order('room_number', { ascending: true }),
  ])

  const building = buildingResult.data
    
  if (!building) {
    notFound()
  }

  return <BuildingHubClient building={building} rooms={roomsResult.data || []} />
}
