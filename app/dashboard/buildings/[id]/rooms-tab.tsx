'use client'

import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Drawer } from 'vaul'
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
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

  // bulk generator state
  const [bulkPrefix, setBulkPrefix] = useState('')
  const [bulkStartFloor, setBulkStartFloor] = useState(1)
  const [bulkNumFloors, setBulkNumFloors] = useState(1)
  const [bulkRoomsPerFloor, setBulkRoomsPerFloor] = useState(10)
  const [bulkDefaultPrice, setBulkDefaultPrice] = useState('')
  const [bulkLockboxPassword, setBulkLockboxPassword] = useState('')
  const [bulkWifiPassword, setBulkWifiPassword] = useState('')
  const [bulkWashingMachineFloor, setBulkWashingMachineFloor] = useState('')
  const [bulkDryerFloor, setBulkDryerFloor] = useState('')
  const [bulkRoomNote, setBulkRoomNote] = useState('')

  const bulkPreview = useMemo(() => {
    const sf = Math.max(1, bulkStartFloor)
    const nf = Math.min(50, Math.max(1, bulkNumFloors))
    const rpf = Math.min(50, Math.max(1, bulkRoomsPerFloor))
    const rooms: { room_number: string; floor: number; wifi_name: string }[] = []
    for (let f = sf; f < sf + nf; f++) {
      for (let r = 1; r <= rpf; r++) {
        const rn = `${f}${String(r).padStart(2, '0')}`
        rooms.push({ floor: f, room_number: rn, wifi_name: bulkPrefix ? `${bulkPrefix}${rn}` : rn })
      }
    }
    return rooms
  }, [bulkPrefix, bulkStartFloor, bulkNumFloors, bulkRoomsPerFloor])

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
    setBulkPrefix('')
    setBulkStartFloor(1)
    setBulkNumFloors(1)
    setBulkRoomsPerFloor(10)
    setBulkDefaultPrice('')
    setBulkLockboxPassword('')
    setBulkWifiPassword('')
    setBulkWashingMachineFloor('')
    setBulkDryerFloor('')
    setBulkRoomNote('')
    setIsModalOpen(true)
  }

  const inferFloor = (roomStr: string): number => {
    const numMatch = roomStr.match(/\d+/)
    if (!numMatch) return 1
    const num = numMatch[0]
    return num.length >= 3 ? parseInt(num.slice(0, -2), 10) || 1 : 1
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
    if (bulkPreview.length === 0) return setError('Chưa có phòng nào được tạo')
    setIsLoading(true)
    setError(null)

    const roomsData = bulkPreview.map(r => ({
      room_number: r.room_number,
      floor: r.floor,
      default_price: bulkDefaultPrice ? Number(bulkDefaultPrice) : 0,
      wifi_name: r.wifi_name,
      wifi_password: bulkWifiPassword || undefined,
      lockbox_password: bulkLockboxPassword || undefined,
      washing_machine_floor: bulkWashingMachineFloor ? Number(bulkWashingMachineFloor) : undefined,
      dryer_floor: bulkDryerFloor ? Number(bulkDryerFloor) : undefined,
      room_note: bulkRoomNote || undefined,
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
    setConfirmDeleteId(null)
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
            <div className="absolute right-3 top-3 flex items-center gap-1">
              {confirmDeleteId !== room.id && (
                <button
                  onClick={() => handleOpenModal(room)}
                  className="rounded-lg bg-zinc-100 p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                >
                  <Edit2 className="size-4" />
                </button>
              )}
              {confirmDeleteId === room.id ? (
                <>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex h-8 items-center rounded-lg bg-zinc-100 px-2.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="flex h-8 items-center rounded-lg bg-red-500 px-2.5 text-xs font-semibold text-white"
                  >
                    Xóa
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(room.id)}
                  className="rounded-lg bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500/20"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
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

      <Drawer.Root open={isModalOpen} onOpenChange={v => { if (!v) setIsModalOpen(false) }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-[200] flex max-h-[90dvh] flex-col rounded-t-[2rem] bg-white/95 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900/95 max-w-130 mx-auto"
            aria-label={editingRoom ? 'Sửa phòng' : 'Thêm phòng'}
          >
            {/* header */}
            <div className="shrink-0 px-4 pt-3 pb-3">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <Drawer.Title className="text-lg font-semibold">
                {editingRoom ? 'Sửa phòng' : 'Thêm phòng'}
              </Drawer.Title>
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
                  {/* Prefix */}
                  <div className="space-y-1.5">
                    <Label>Tiền tố</Label>
                    <p className="text-[11px] text-zinc-500">Tên phòng và Wi-Fi = tiền tố + số phòng. VD: tiền tố <strong>NM</strong> → phòng <strong>101</strong>, Wi-Fi <strong>NM101</strong></p>
                    <Input
                      value={bulkPrefix}
                      onChange={e => setBulkPrefix(e.target.value)}
                      placeholder="VD: NM"
                    />
                  </div>

                  {/* Floor layout */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Tầng bắt đầu</Label>
                      <Input
                        type="number"
                        min={1}
                        value={bulkStartFloor}
                        onChange={e => setBulkStartFloor(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Số tầng</Label>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={bulkNumFloors}
                        onChange={e => setBulkNumFloors(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phòng/tầng</Label>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={bulkRoomsPerFloor}
                        onChange={e => setBulkRoomsPerFloor(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-1.5">
                    <Label>Giá mặc định (đ/đêm) — tất cả phòng</Label>
                    <Input
                      type="number"
                      value={bulkDefaultPrice}
                      onChange={e => setBulkDefaultPrice(e.target.value)}
                      placeholder="VD: 500000"
                    />
                  </div>

                  {/* Lockbox + Wifi */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Mã hộp khóa — tất cả</Label>
                      <Input
                        value={bulkLockboxPassword}
                        onChange={e => setBulkLockboxPassword(e.target.value)}
                        placeholder="VD: 1234"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Mật khẩu Wi-Fi — tất cả</Label>
                      <Input
                        value={bulkWifiPassword}
                        onChange={e => setBulkWifiPassword(e.target.value)}
                        placeholder="VD: 88888888"
                      />
                    </div>
                  </div>

                  {/* Washer / Dryer */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Tầng máy giặt</Label>
                      <Input
                        type="number"
                        value={bulkWashingMachineFloor}
                        onChange={e => setBulkWashingMachineFloor(e.target.value)}
                        placeholder="5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tầng máy sấy</Label>
                      <Input
                        type="number"
                        value={bulkDryerFloor}
                        onChange={e => setBulkDryerFloor(e.target.value)}
                        placeholder="5"
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-1.5">
                    <Label>Ghi chú — tất cả phòng</Label>
                    <textarea
                      value={bulkRoomNote}
                      onChange={e => setBulkRoomNote(e.target.value)}
                      placeholder="Ghi chú áp dụng cho tất cả phòng..."
                      className="flex min-h-20 w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                    />
                  </div>

                  {/* Preview */}
                  {bulkPreview.length > 0 && (
                    <div className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
                      <p className="mb-2 text-xs font-semibold text-zinc-500">
                        Xem trước — {bulkPreview.length} phòng
                      </p>
                      <div className="max-h-40 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-1.5">
                          {bulkPreview.map(r => (
                            <div
                              key={r.room_number}
                              className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-xs dark:bg-zinc-800"
                            >
                              <span className="font-mono font-bold">{r.room_number}</span>
                              <span className="text-zinc-400">{r.wifi_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

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
                {isLoading
                  ? 'Đang lưu...'
                  : activeTab === 'bulk'
                  ? `Tạo ${bulkPreview.length} phòng`
                  : 'Lưu phòng'}
              </Button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
