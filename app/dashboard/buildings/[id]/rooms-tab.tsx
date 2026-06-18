'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createRoom, updateRoom, deleteRoom } from './rooms-actions'
import { motion, AnimatePresence } from 'framer-motion'
import { Tables } from '@/types/supabase'

export default function RoomsTab({ buildingId, initialRooms }: { buildingId: string, initialRooms: Tables<'rooms'>[] }) {
  const [rooms] = useState(initialRooms)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Tables<'rooms'> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [roomNumber, setRoomNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [lockboxPassword, setLockboxPassword] = useState('')
  const [wifiName, setWifiName] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [washingMachineFloor, setWashingMachineFloor] = useState('')
  const [dryerFloor, setDryerFloor] = useState('')
  const [roomNote, setRoomNote] = useState('')

  const handleOpenModal = (room?: Tables<'rooms'>) => {
    if (room) {
      setEditingRoom(room)
      setRoomNumber(room.room_number)
      setFloor(room.floor.toString())
      setLockboxPassword(room.lockbox_password || '')
      setWifiName(room.wifi_name || '')
      setWifiPassword(room.wifi_password || '')
      setWashingMachineFloor(room.washing_machine_floor?.toString() || '')
      setDryerFloor(room.dryer_floor?.toString() || '')
      setRoomNote(room.room_note || '')
    } else {
      setEditingRoom(null)
      setRoomNumber('')
      setFloor('')
      setLockboxPassword('')
      setWifiName('')
      setWifiPassword('')
      setWashingMachineFloor('')
      setDryerFloor('')
      setRoomNote('')
    }
    setError(null)
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!roomNumber || !floor) return setError('Room number and floor are required')
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('building_id', buildingId)
    formData.append('room_number', roomNumber)
    formData.append('floor', floor)
    formData.append('lockbox_password', lockboxPassword)
    formData.append('wifi_name', wifiName)
    formData.append('wifi_password', wifiPassword)
    formData.append('washing_machine_floor', washingMachineFloor)
    formData.append('dryer_floor', dryerFloor)
    formData.append('room_note', roomNote)

    let result
    if (editingRoom) {
      result = await updateRoom(editingRoom.id, formData)
    } else {
      result = await createRoom(formData)
    }

    if (result?.error) {
      setError(result.error)
    } else {
      // Reload rooms state manually for quick UX, or we can rely on router.refresh() 
      // but router.refresh won't update local state if we don't sync.
      // Since `actions` revalidate paths, we can just force a window reload or update locally.
      window.location.reload()
    }
    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return
    setIsLoading(true)
    await deleteRoom(id)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Rooms</h2>
        <Button onClick={() => handleOpenModal()} className="h-11 rounded-lg">
          <Plus className="mr-2 size-4" /> Add Room
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {rooms.map(room => (
          <Card key={room.id} className="group relative transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
            <div className="absolute right-3 top-3 flex gap-1">
              <button onClick={() => handleOpenModal(room)} className="rounded-lg bg-zinc-100 p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
                <Edit2 className="size-4" />
              </button>
              <button onClick={() => handleDelete(room.id)} className="rounded-lg bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500/20">
                <Trash2 className="size-4" />
              </button>
            </div>
            <CardHeader className="p-4 pb-3 pr-24">
              <CardTitle className="text-2xl">{room.room_number}</CardTitle>
              <p className="text-xs font-medium text-muted-foreground uppercase">Floor {room.floor}</p>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Lockbox: <span className="text-foreground">{room.lockbox_password || 'N/A'}</span></p>
                <p>Wi-Fi: <span className="text-foreground">{room.wifi_name || 'N/A'}</span></p>
                <p>Pass: <span className="text-foreground">{room.wifi_password || 'N/A'}</span></p>
                <p>Washer: <span className="text-foreground">{room.washing_machine_floor != null ? `Floor ${room.washing_machine_floor}` : 'N/A'}</span></p>
                <p>Dryer: <span className="text-foreground">{room.dryer_floor != null ? `Floor ${room.dryer_floor}` : 'N/A'}</span></p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center text-muted-foreground dark:border-zinc-800">
          No rooms found. Click &quot;Add Room&quot; to create one.
        </div>
      )}

      {/* Modal / Form Sheet */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="max-h-[92dvh] w-full max-w-[520px] space-y-5 overflow-y-auto rounded-t-lg bg-white p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-zinc-950 sm:rounded-lg"
            >
              <h2 className="text-xl font-semibold">{editingRoom ? 'Edit Room' : 'New Room'}</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Room Number</Label>
                    <Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="e.g., 101" />
                  </div>
                  <div className="space-y-2">
                    <Label>Floor</Label>
                    <Input type="number" value={floor} onChange={e => setFloor(e.target.value)} placeholder="1" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Lockbox Password</Label>
                  <Input value={lockboxPassword} onChange={e => setLockboxPassword(e.target.value)} placeholder="e.g., 1234" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Wi-Fi Name</Label>
                    <Input value={wifiName} onChange={e => setWifiName(e.target.value)} placeholder="Room 101 Wi-Fi" />
                  </div>
                  <div className="space-y-2">
                    <Label>Wi-Fi Password</Label>
                    <Input value={wifiPassword} onChange={e => setWifiPassword(e.target.value)} placeholder="88888888" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Washing Machine Floor</Label>
                    <Input type="number" value={washingMachineFloor} onChange={e => setWashingMachineFloor(e.target.value)} placeholder="5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Dryer Floor</Label>
                    <Input type="number" value={dryerFloor} onChange={e => setDryerFloor(e.target.value)} placeholder="5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Room Note</Label>
                  <textarea
                    value={roomNote}
                    onChange={e => setRoomNote(e.target.value)}
                    placeholder="p101 and p501 use the washing machine and dryer on the 5th floor."
                    className="flex min-h-24 w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                  />
                </div>
                
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} className="flex-1 rounded-lg" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Room'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
