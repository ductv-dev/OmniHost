import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tables } from '@/types/supabase'

type RoomWithBuilding = Tables<'rooms'> & {
  building: { name: string } | null
}

export default async function RoomsPage() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('rooms')
    .select(`
      *,
      building:buildings(name)
    `)
    .order('created_at', { ascending: false })

  const rooms = (data || []) as RoomWithBuilding[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
          <p className="text-muted-foreground">Manage individual rooms within buildings.</p>
        </div>
        <Link href="/dashboard/rooms/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Room
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Building</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Wi-Fi</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!rooms || rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No rooms found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">
                    {room.building?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>{room.room_number}</TableCell>
                  <TableCell>{room.floor}</TableCell>
                  <TableCell>{room.wifi_name || '-'}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-muted-foreground">Manage</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
