'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createRoom, updateRoom, deleteRoom, createBulkRooms } from './rooms-actions'
import { Tables } from '@/types/supabase'

export default function RoomsTab({
  buildingId,
  initialRooms,
}: {
  buildingId: string
  initialRooms: Tables<'rooms'>[]
}) {
  const [rooms] = useState(initialRooms)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Tables<'rooms'> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [roomNumber, setRoomNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [defaultPrice, setDefaultPrice] = useState('')
  const [lockboxPassword, setLockboxPassword] = useState('')
  const [wifiName, setWifiName] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [washingMachineFloor, setWashingMachineFloor] = useState('')
  const [dryerFloor, setDryerFloor] = useState('')
  const [roomNote, setRoomNote] = useState('')
  
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single')
  const [bulkRoomsText, setBulkRoomsText] = useState('')

  const inferFloor = (roomStr: string): number => {
    const numMatch = roomStr.match(/\d+/)
    if (!numMatch) return 1
    const num = numMatch[0]
    if (num.length >= 3) {
      return parseInt(num.slice(0, -2), 10) || 1
    }
    return 1
  }

  const handleOpenModal = (room?: Tables<'rooms'>) => {
    if (room) {
      setEditingRoom(room)
      setRoomNumber(room.room_number)
      setFloor(room.floor.toString())
      setDefaultPrice(room.default_price?.toString() || '')
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
      setDefaultPrice('')
      setLockboxPassword('')
      setWifiName('')
      setWifiPassword('')
      setWashingMachineFloor('')
      setDryerFloor('')
      setRoomNote('')
    }
    setError(null)
    setActiveTab('single')
    setBulkRoomsText('')
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (activeTab === 'bulk') return handleBulkSave()

    const floorToUse = floor.trim() || inferFloor(roomNumber).toString()
    if (!roomNumber || !floorToUse) return setError('Vui lòng nhập số phòng')
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('building_id', buildingId)
    formData.append('room_number', roomNumber)
    formData.append('floor', floorToUse)
    formData.append('default_price', defaultPrice)
    formData.append('lockbox_password', lockboxPassword)
    formData.append('wifi_name', wifiName)
    formData.append('wifi_password', wifiPassword)
    formData.append('washing_machine_floor', washingMachineFloor)
    formData.append('dryer_floor', dryerFloor)
    formData.append('room_note', roomNote)

    const result = editingRoom
      ? await updateRoom(editingRoom.id, formData)
      : await createRoom(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      window.location.reload()
    }
    setIsLoading(false)
  }

  const handleBulkSave = async () => {
    if (!bulkRoomsText.trim()) return setError('Vui lòng nhập danh sách phòng')
    setIsLoading(true)
    setError(null)

    const rawRooms = bulkRoomsText.split(/[\n,;]+/).map(r => r.trim()).filter(Boolean)
    const roomsData = rawRooms.map(r => ({
      room_number: r,
      floor: inferFloor(r),
      default_price: defaultPrice ? Number(defaultPrice) : 0,
    }))

    const result = await createBulkRooms(buildingId, roomsData)
    if (result?.error) {
      setError(result.error)
    } else {
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
          <Card
            key={room.id}
            className="group relative transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            <div className="absolute right-3 top-3 flex gap-1">
              <button
                onClick={() => handleOpenModal(room)}
                className="rounded-lg bg-zinc-100 p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                <Edit2 className="size-4" />
              </button>
              <button
                onClick={() => handleDelete(room.id)}
                className="rounded-lg bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500/20"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <CardHeader className="p-4 pb-3 pr-24">
              <CardTitle className="text-2xl">{room.room_number}</CardTitle>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Floor {room.floor}
              </p>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-200 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92dvh] w-full max-w-130 flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-950 sm:rounded-xl">
            {/* header */}
            <div className="shrink-0 px-4 pt-3 pb-3">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 sm:hidden" />
              <h2 className="text-lg font-semibold">
                {editingRoom ? 'Sửa phòng' : 'Thêm phòng'}
              </h2>
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto border-t border-zinc-100 px-4 py-4 dark:border-zinc-900">
              {!editingRoom && (
                <div className="mb-4 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
                  <button
                    onClick={() => setActiveTab('single')}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${activeTab === 'single' ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
                  >
                    Tạo từng phòng
                  </button>
                  <button
                    onClick={() => setActiveTab('bulk')}
                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${activeTab === 'bulk' ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
                  >
                    Tạo nhiều phòng
                  </button>
                </div>
              )}

              {activeTab === 'single' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Số phòng</Label>
                      <Input
                        value={roomNumber}
                        onChange={e => setRoomNumber(e.target.value)}
                        placeholder="VD: 101"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tầng</Label>
                      <Input
                        type="number"
                        value={floor}
                        onChange={e => setFloor(e.target.value)}
                        placeholder="VD: 1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Giá phòng mặc định (đ/đêm)</Label>
                    <Input
                      type="number"
                      value={defaultPrice}
                      onChange={e => setDefaultPrice(e.target.value)}
                      placeholder="VD: 500000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mã hộp khóa</Label>
                    <Input
                      value={lockboxPassword}
                      onChange={e => setLockboxPassword(e.target.value)}
                      placeholder="VD: 1234"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Tên Wi-Fi</Label>
                      <Input
                        value={wifiName}
                        onChange={e => setWifiName(e.target.value)}
                        placeholder="Wi-Fi phòng 101"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mật khẩu Wi-Fi</Label>
                      <Input
                        value={wifiPassword}
                        onChange={e => setWifiPassword(e.target.value)}
                        placeholder="88888888"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Tầng máy giặt</Label>
                      <Input
                        type="number"
                        value={washingMachineFloor}
                        onChange={e => setWashingMachineFloor(e.target.value)}
                        placeholder="5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tầng máy sấy</Label>
                      <Input
                        type="number"
                        value={dryerFloor}
                        onChange={e => setDryerFloor(e.target.value)}
                        placeholder="5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ghi chú phòng</Label>
                    <textarea
                      value={roomNote}
                      onChange={e => setRoomNote(e.target.value)}
                      placeholder="VD: p101 và p501 dùng máy giặt tầng 5."
                      className="flex min-h-24 w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                    />
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Danh sách phòng</Label>
                    <textarea
                      value={bulkRoomsText}
                      onChange={e => setBulkRoomsText(e.target.value)}
                      placeholder="Nhập các phòng cách nhau bằng dấu phẩy hoặc xuống dòng.&#10;VD:&#10;101, 102&#10;201, 202"
                      className="flex min-h-32 w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Tầng sẽ được tự động suy ra từ số phòng (VD: 101 → Tầng 1, 1405 → Tầng 14). Mật khẩu hộp khóa và Wi-Fi có thể cập nhật sau.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Giá phòng mặc định chung (đ/đêm)</Label>
                    <Input
                      type="number"
                      value={defaultPrice}
                      onChange={e => setDefaultPrice(e.target.value)}
                      placeholder="Tùy chọn: Nhập giá chung cho tất cả"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
              )}
            </div>

            {/* sticky footer */}
            <div className="shrink-0 grid grid-cols-2 gap-3 border-t border-zinc-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
              <Button
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleSave} className="h-12 rounded-xl" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu phòng'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
