'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, ChevronRight, KeyRound, MapPin, Plus, X } from 'lucide-react'
import { Drawer } from 'vaul'
import { createClient } from '@/lib/supabase/client'
import { createBuildingInline } from './actions'

interface Building {
  id: string
  name: string
  sign_name: string | null
  address: string
  gate_password: string | null
  created_at: string
}

const inputClass = 'flex h-11 w-full rounded-lg border-0 bg-black/5 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10'
const textareaClass = 'flex min-h-20 w-full resize-none rounded-lg border-0 bg-black/5 px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10'

export default function BuildingsPage() {
  const router = useRouter()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // form state
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

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('buildings')
      .select('id, name, sign_name, address, gate_password, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBuildings((data ?? []) as Building[])
        setLoading(false)
      })
  }, [])

  function openDrawer() {
    setName(''); setSignName(''); setAddress(''); setMapLink('')
    setGatePassword(''); setLobbyWifiName(''); setLobbyWifiPassword('')
    setDrinkingWaterNote(''); setMotorbikeNote(''); setError(null)
    setDrawerOpen(true)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
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
    setDrawerOpen(false)
    router.refresh()
    // Reload buildings list
    const supabase = createClient()
    const { data } = await supabase
      .from('buildings')
      .select('id, name, sign_name, address, gate_password, created_at')
      .order('created_at', { ascending: false })
    setBuildings((data ?? []) as Building[])
  }

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-lg bg-zinc-950 p-4 text-white dark:bg-white dark:text-zinc-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Quản lý
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Tòa nhà</h1>
          <p className="mt-1 text-sm text-zinc-300 dark:text-zinc-600">
            {buildings.length} tòa nhà
          </p>
        </div>

        <button
          onClick={openDrawer}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 text-base font-semibold text-white transition-colors active:scale-95 dark:bg-white dark:text-zinc-950"
        >
          <Plus className="size-4" /> Thêm tòa nhà
        </button>

        <div className="grid gap-3">
          {loading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            ))
          ) : buildings.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <Building2 className="mb-3 size-9 text-zinc-400" />
              <p className="font-medium">Chưa có tòa nhà</p>
              <p className="mt-1 text-sm text-zinc-500">Nhấn &ldquo;Thêm tòa nhà&rdquo; để bắt đầu.</p>
            </div>
          ) : (
            buildings.map(building => (
              <Link
                key={building.id}
                href={`/dashboard/buildings/${building.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-colors active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-lg font-semibold">{building.name}</h3>
                  <ChevronRight className="mt-0.5 size-5 shrink-0 text-zinc-400" />
                </div>
                <div className="mt-2 flex min-w-0 items-start gap-2 text-sm text-zinc-500">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span className="line-clamp-2">{building.address}</span>
                </div>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-500 dark:bg-zinc-900">
                    <KeyRound className="size-3.5" />
                    {building.gate_password || 'Chưa có mã cổng'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* ── Add Building Drawer ── */}
      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[2rem] border-t border-white/20 bg-white/95 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900/95"
            aria-label="Thêm tòa nhà"
          >
            <div className="shrink-0 px-5 pt-4">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <div className="flex items-center justify-between">
                <Drawer.Title className="text-lg font-bold">Thêm tòa nhà</Drawer.Title>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="space-y-4">
                  {error && (
                    <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>
                  )}

                  <Field label="Tên tòa nhà *">
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Sunset Apartments" className={inputClass} required />
                  </Field>
                  <Field label="Tên biển hiệu">
                    <input value={signName} onChange={e => setSignName(e.target.value)} placeholder="NM House Da Nang" className={inputClass} />
                  </Field>
                  <Field label="Địa chỉ *">
                    <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Nguyễn Văn Linh, Đà Nẵng" className={inputClass} required />
                  </Field>
                  <Field label="Link Google Maps">
                    <input value={mapLink} onChange={e => setMapLink(e.target.value)} placeholder="https://maps.google.com/..." type="url" className={inputClass} />
                  </Field>
                  <Field label="Mật khẩu cổng">
                    <input value={gatePassword} onChange={e => setGatePassword(e.target.value)} placeholder="1234*" className={inputClass} />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tên Wifi sảnh">
                      <input value={lobbyWifiName} onChange={e => setLobbyWifiName(e.target.value)} placeholder="29 AT39" className={inputClass} />
                    </Field>
                    <Field label="Mật khẩu Wifi">
                      <input value={lobbyWifiPassword} onChange={e => setLobbyWifiPassword(e.target.value)} placeholder="TP888888" className={inputClass} />
                    </Field>
                  </div>

                  <Field label="Ghi chú nước uống">
                    <textarea value={drinkingWaterNote} onChange={e => setDrinkingWaterNote(e.target.value)} placeholder="Vòi nước này đã qua lọc, có thể uống trực tiếp..." className={textareaClass} />
                  </Field>
                  <Field label="Ghi chú để xe">
                    <textarea value={motorbikeNote} onChange={e => setMotorbikeNote(e.target.value)} placeholder="Xe máy gửi tại tầng 1 vào ban đêm..." className={textareaClass} />
                  </Field>
                </div>
              </div>

              <div className="shrink-0 border-t border-zinc-100 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 dark:border-zinc-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-14 w-full rounded-2xl bg-zinc-950 text-base font-bold text-white transition-transform active:scale-95 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
                >
                  {saving ? 'Đang lưu…' : 'Tạo tòa nhà'}
                </button>
              </div>
            </form>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
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
