'use client'

import { useState } from 'react'
import { Building2, Check, ChevronRight, MapPin, Plus, X } from 'lucide-react'
import { Drawer } from 'vaul'
import { useBuilding } from './building-context'
import { createBuildingInline } from '@/app/dashboard/buildings/actions'

const inputCls = 'flex h-11 w-full rounded-xl border-0 bg-zinc-100 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-800'
const textareaCls = 'flex min-h-[4.5rem] w-full resize-none rounded-xl border-0 bg-zinc-100 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-800'

interface BuildingPickerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export default function BuildingPicker({ open, onOpenChange }: BuildingPickerProps) {
  const { buildings, selectedId, setSelectedId, refetchBuildings } = useBuilding()
  const [addOpen, setAddOpen] = useState(false)

  function handleSelect(id: string) {
    setSelectedId(id)
    onOpenChange(false)
  }

  async function handleAdded(newId: string) {
    await refetchBuildings()
    setSelectedId(newId)
    setAddOpen(false)
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[80dvh] flex-col rounded-t-[2rem] border-t border-white/20 bg-white/95 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900/95"
          aria-label="Chọn tòa nhà"
        >
          {/* Handle + header */}
          <div className="shrink-0 px-5 pt-4 pb-2">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="flex items-center justify-between">
              <Drawer.Title className="text-base font-bold text-zinc-950 dark:text-white">
                Chọn tòa nhà
              </Drawer.Title>
              <button
                onClick={() => onOpenChange(false)}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="space-y-2 py-2">
              {buildings.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Building2 className="size-8 text-zinc-300" />
                  <p className="text-sm text-zinc-400">Chưa có tòa nhà nào</p>
                </div>
              ) : (
                buildings.map(b => {
                  const isSelected = b.id === selectedId
                  return (
                    <button
                      key={b.id}
                      onClick={() => handleSelect(b.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors active:scale-[0.99] ${
                        isSelected
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                          : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{b.name}</p>
                        <div className={`mt-0.5 flex items-center gap-1 ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate text-xs">{b.address}</span>
                        </div>
                      </div>
                      {isSelected
                        ? <Check className="size-4 shrink-0" />
                        : <ChevronRight className="size-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
                      }
                    </button>
                  )
                })
              )}

              {/* Add button */}
              <button
                onClick={() => setAddOpen(true)}
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-zinc-300 px-4 py-3 text-left text-sm font-semibold text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 active:scale-[0.99] dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
              >
                <Plus className="size-4" />
                Thêm tòa nhà mới
              </button>
            </div>
          </div>

          {/* Nested add-building drawer */}
          <AddBuildingDrawer
            open={addOpen}
            onOpenChange={setAddOpen}
            onAdded={handleAdded}
          />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

// ── Nested drawer ──────────────────────────────────────────────────────────────

function AddBuildingDrawer({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdded: (newId: string) => void
}) {
  const [name, setName] = useState('')
  const [signName, setSignName] = useState('')
  const [address, setAddress] = useState('')
  const [mapLink, setMapLink] = useState('')
  const [gatePassword, setGatePassword] = useState('')
  const [lobbyWifiName, setLobbyWifiName] = useState('')
  const [lobbyWifiPassword, setLobbyWifiPassword] = useState('')
  const [drinkingWaterNote, setDrinkingWaterNote] = useState('')
  const [motorbikeNote, setMotorbikeNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(v: boolean) {
    if (!v) {
      setName(''); setSignName(''); setAddress(''); setMapLink('')
      setGatePassword(''); setLobbyWifiName(''); setLobbyWifiPassword('')
      setDrinkingWaterNote(''); setMotorbikeNote(''); setError(null)
    }
    onOpenChange(v)
  }

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const result = await createBuildingInline({
      name, sign_name: signName, address, map_link: mapLink,
      gate_password: gatePassword, lobby_wifi_name: lobbyWifiName,
      lobby_wifi_password: lobbyWifiPassword,
      drinking_water_note: drinkingWaterNote,
      motorbike_parking_note: motorbikeNote,
    })
    setSaving(false)
    if ('error' in result) { setError(result.error); return }
    onAdded(result.id)
  }

  return (
    <Drawer.NestedRoot open={open} onOpenChange={handleOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-60 flex max-h-[92dvh] flex-col rounded-t-[2rem] border-t border-white/20 bg-white shadow-2xl dark:bg-zinc-900"
          aria-label="Thêm tòa nhà"
        >
          <div className="shrink-0 px-5 pt-4">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="flex items-center justify-between">
              <Drawer.Title className="text-lg font-bold">Thêm tòa nhà</Drawer.Title>
              <button
                onClick={() => handleOpenChange(false)}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="space-y-4">
                {error && (
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                    {error}
                  </p>
                )}

                <Field label="Tên tòa nhà *">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Sunset Apartments" className={inputCls} required />
                </Field>
                <Field label="Tên biển hiệu">
                  <input value={signName} onChange={e => setSignName(e.target.value)} placeholder="NM House Da Nang" className={inputCls} />
                </Field>
                <Field label="Địa chỉ *">
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Nguyễn Văn Linh, Đà Nẵng" className={inputCls} required />
                </Field>
                <Field label="Link Google Maps">
                  <input value={mapLink} onChange={e => setMapLink(e.target.value)} placeholder="https://maps.google.com/..." type="url" className={inputCls} />
                </Field>
                <Field label="Mật khẩu cổng">
                  <input value={gatePassword} onChange={e => setGatePassword(e.target.value)} placeholder="1234*" className={inputCls} />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tên Wifi sảnh">
                    <input value={lobbyWifiName} onChange={e => setLobbyWifiName(e.target.value)} placeholder="29 AT39" className={inputCls} />
                  </Field>
                  <Field label="Mật khẩu Wifi">
                    <input value={lobbyWifiPassword} onChange={e => setLobbyWifiPassword(e.target.value)} placeholder="TP888888" className={inputCls} />
                  </Field>
                </div>

                <Field label="Ghi chú nước uống">
                  <textarea value={drinkingWaterNote} onChange={e => setDrinkingWaterNote(e.target.value)} placeholder="Vòi nước đã qua lọc, uống trực tiếp được..." className={textareaCls} />
                </Field>
                <Field label="Ghi chú để xe">
                  <textarea value={motorbikeNote} onChange={e => setMotorbikeNote(e.target.value)} placeholder="Xe máy gửi tầng 1 vào ban đêm..." className={textareaCls} />
                </Field>

                {/* Submit inside scroll — tránh keyboard push */}
                <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-14 w-full rounded-2xl bg-zinc-950 text-base font-bold text-white transition-transform active:scale-95 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
                  >
                    {saving ? 'Đang lưu…' : 'Tạo tòa nhà'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="px-1 text-xs font-semibold text-zinc-500">{label}</label>
      {children}
    </div>
  )
}
