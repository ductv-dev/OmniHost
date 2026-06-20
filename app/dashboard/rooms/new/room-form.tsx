'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createRoom, createRoomsBulk } from '../actions'

// ─── Single room schema ───────────────────────────────────────────────────────
const singleSchema = z.object({
  building_id: z.string().uuid('Chọn tòa nhà'),
  room_number: z.string().min(1, 'Bắt buộc'),
  floor: z.coerce.number().min(0),
  default_price: z.preprocess(
    v => (v === '' || v === null ? 0 : v),
    z.coerce.number().int().min(0).default(0)
  ),
  lockbox_password: z.string().optional(),
  wifi_name: z.string().optional(),
  wifi_password: z.string().optional(),
  washing_machine_floor: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.coerce.number().optional()
  ),
  dryer_floor: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.coerce.number().optional()
  ),
  room_note: z.string().optional(),
})

// ─── Bulk schema ──────────────────────────────────────────────────────────────
const bulkSchema = z.object({
  building_id: z.string().uuid('Chọn tòa nhà'),
  prefix: z.string().min(1, 'Bắt buộc').max(10),
  start_floor: z.coerce.number().int().min(1),
  num_floors: z.coerce.number().int().min(1).max(50),
  rooms_per_floor: z.coerce.number().int().min(1).max(50),
  default_price: z.preprocess(
    v => (v === '' || v === null ? 0 : v),
    z.coerce.number().int().min(0).default(0)
  ),
  lockbox_password: z.string().optional(),
  wifi_password: z.string().optional(),
  washing_machine_floor: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.coerce.number().optional()
  ),
  dryer_floor: z.preprocess(
    v => (v === '' || v === null ? undefined : v),
    z.coerce.number().optional()
  ),
  room_note: z.string().optional(),
})

type SingleInput = z.input<typeof singleSchema>
type SingleData = z.output<typeof singleSchema>
type BulkInput = z.input<typeof bulkSchema>
type BulkData = z.output<typeof bulkSchema>

type Props = { buildings: { id: string; name: string }[] }

// ─── Shared field styles ──────────────────────────────────────────────────────
const inputCls =
  'flex h-10 w-full rounded-lg border-0 bg-black/5 px-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10'
const selectCls =
  'flex h-10 w-full rounded-lg border-0 bg-black/5 px-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10'

export default function RoomForm({ buildings }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'single' | 'bulk'>('single')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // ── Single form ─────────────────────────────────────────────────────────────
  const single = useForm<SingleInput, unknown, SingleData>({
    resolver: zodResolver(singleSchema),
    defaultValues: {
      building_id: '',
      room_number: '',
      floor: 1,
      default_price: '',
      lockbox_password: '',
      wifi_name: '',
      wifi_password: '',
      washing_machine_floor: '',
      dryer_floor: '',
      room_note: '',
    },
  })

  // ── Bulk form ───────────────────────────────────────────────────────────────
  const bulk = useForm<BulkInput, unknown, BulkData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      building_id: '',
      prefix: '',
      start_floor: 1,
      num_floors: 1,
      rooms_per_floor: 10,
      default_price: '',
      lockbox_password: '',
      wifi_password: '',
      washing_machine_floor: '',
      dryer_floor: '',
      room_note: '',
    },
  })

  const watchedPrefix = bulk.watch('prefix')
  const watchedStartFloor = bulk.watch('start_floor')
  const watchedNumFloors = bulk.watch('num_floors')
  const watchedRoomsPerFloor = bulk.watch('rooms_per_floor')

  const preview = useMemo(() => {
    const sf = Number(watchedStartFloor) || 1
    const nf = Math.min(Number(watchedNumFloors) || 1, 50)
    const rpf = Math.min(Number(watchedRoomsPerFloor) || 1, 50)
    const prefix = watchedPrefix || ''
    const rooms: { floor: number; room_number: string; wifi_name: string }[] = []
    for (let f = sf; f < sf + nf; f++) {
      for (let r = 1; r <= rpf; r++) {
        const rn = `${f}${String(r).padStart(2, '0')}`
        rooms.push({ floor: f, room_number: rn, wifi_name: prefix ? `${prefix}${rn}` : rn })
      }
    }
    return rooms
  }, [watchedPrefix, watchedStartFloor, watchedNumFloors, watchedRoomsPerFloor])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const onSingleSubmit = async (data: SingleData) => {
    setIsLoading(true)
    setError(null)
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => fd.append(k, v?.toString() ?? ''))
    const result = await createRoom(fd)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  const onBulkSubmit = async (data: BulkData) => {
    setIsLoading(true)
    setError(null)
    const result = await createRoomsBulk(data)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/20 shadow-xl">
      <CardHeader>
        <CardTitle>Thêm phòng</CardTitle>
        <CardDescription>Tạo một hoặc nhiều phòng cùng lúc.</CardDescription>
        {/* Tab toggle */}
        <div className="mt-3 flex gap-2">
          {(['single', 'bulk'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null) }}
              className={`rounded-2xl px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                  : 'bg-black/5 text-muted-foreground hover:bg-black/10 dark:bg-white/10'
              }`}
            >
              {t === 'single' ? 'Đơn lẻ' : 'Hàng loạt'}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* ── SINGLE ── */}
        {tab === 'single' && (
          <form onSubmit={single.handleSubmit(onSingleSubmit)} className="space-y-4">
            <Field label="Tòa nhà" error={single.formState.errors.building_id?.message}>
              <select className={selectCls} {...single.register('building_id')}>
                <option value="" disabled>Chọn tòa nhà</option>
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Số phòng" error={single.formState.errors.room_number?.message}>
                <Input className={inputCls} placeholder="101" {...single.register('room_number')} />
              </Field>
              <Field label="Tầng" error={single.formState.errors.floor?.message}>
                <Input className={inputCls} type="number" placeholder="1" {...single.register('floor')} />
              </Field>
            </div>

            <Field label="Giá mặc định (đ/đêm)">
              <Input className={inputCls} type="number" placeholder="500000" {...single.register('default_price')} />
            </Field>

            <Field label="Mật khẩu lockbox">
              <Input className={inputCls} placeholder="4321" {...single.register('lockbox_password')} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tên Wi-Fi">
                <Input className={inputCls} placeholder="NM101" {...single.register('wifi_name')} />
              </Field>
              <Field label="Mật khẩu Wi-Fi">
                <Input className={inputCls} placeholder="password" {...single.register('wifi_password')} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tầng máy giặt">
                <Input className={inputCls} type="number" placeholder="5" {...single.register('washing_machine_floor')} />
              </Field>
              <Field label="Tầng máy sấy">
                <Input className={inputCls} type="number" placeholder="5" {...single.register('dryer_floor')} />
              </Field>
            </div>

            <Field label="Ghi chú phòng">
              <textarea
                className="flex min-h-20 w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                placeholder="Ghi chú thêm về phòng..."
                {...single.register('room_note')}
              />
            </Field>

            <ErrorBox message={error} />
            <FormActions onCancel={() => router.back()} isLoading={isLoading} label="Lưu phòng" />
          </form>
        )}

        {/* ── BULK ── */}
        {tab === 'bulk' && (
          <form onSubmit={bulk.handleSubmit(onBulkSubmit)} className="space-y-4">
            <Field label="Tòa nhà" error={bulk.formState.errors.building_id?.message}>
              <select className={selectCls} {...bulk.register('building_id')}>
                <option value="" disabled>Chọn tòa nhà</option>
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>

            {/* Prefix + layout */}
            <Field
              label="Tiền tố phòng"
              hint="Dùng cho số phòng và tên Wi-Fi. VD: NM → phòng NM101, Wi-Fi NM101"
              error={bulk.formState.errors.prefix?.message}
            >
              <Input className={inputCls} placeholder="NM" {...bulk.register('prefix')} />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Tầng bắt đầu" error={bulk.formState.errors.start_floor?.message}>
                <Input className={inputCls} type="number" min={1} {...bulk.register('start_floor')} />
              </Field>
              <Field label="Số tầng" error={bulk.formState.errors.num_floors?.message}>
                <Input className={inputCls} type="number" min={1} max={50} {...bulk.register('num_floors')} />
              </Field>
              <Field label="Phòng/tầng" error={bulk.formState.errors.rooms_per_floor?.message}>
                <Input className={inputCls} type="number" min={1} max={50} {...bulk.register('rooms_per_floor')} />
              </Field>
            </div>

            <Field label="Giá mặc định (đ/đêm) — áp dụng cho tất cả">
              <Input className={inputCls} type="number" placeholder="500000" {...bulk.register('default_price')} />
            </Field>

            <Field label="Mật khẩu lockbox — áp dụng cho tất cả">
              <Input className={inputCls} placeholder="1234" {...bulk.register('lockbox_password')} />
            </Field>

            <Field label="Mật khẩu Wi-Fi — áp dụng cho tất cả (tên Wi-Fi = tiền tố + số phòng)">
              <Input className={inputCls} placeholder="password" {...bulk.register('wifi_password')} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tầng máy giặt">
                <Input className={inputCls} type="number" placeholder="5" {...bulk.register('washing_machine_floor')} />
              </Field>
              <Field label="Tầng máy sấy">
                <Input className={inputCls} type="number" placeholder="5" {...bulk.register('dryer_floor')} />
              </Field>
            </div>

            <Field label="Ghi chú phòng — áp dụng cho tất cả">
              <textarea
                className="flex min-h-20 w-full rounded-lg border-0 bg-black/5 px-4 py-3 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:bg-white/10"
                placeholder="Ghi chú thêm..."
                {...bulk.register('room_note')}
              />
            </Field>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 space-y-2">
                <p className="text-sm font-medium">
                  Xem trước — {preview.length} phòng sẽ được tạo
                </p>
                <div className="max-h-48 overflow-y-auto scrollbar-none">
                  <div className="grid grid-cols-2 gap-1.5">
                    {preview.map(r => (
                      <div
                        key={r.room_number}
                        className="flex items-center justify-between rounded-xl bg-white/60 dark:bg-zinc-800/60 px-3 py-1.5 text-xs"
                      >
                        <span className="font-mono font-semibold">{r.room_number}</span>
                        <span className="text-muted-foreground">{r.wifi_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <ErrorBox message={error} />
            <FormActions
              onCancel={() => router.back()}
              isLoading={isLoading}
              label={`Tạo ${preview.length} phòng`}
            />
          </form>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="rounded-xl bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/30">
      {message}
    </div>
  )
}

function FormActions({
  onCancel,
  isLoading,
  label,
}: {
  onCancel: () => void
  isLoading: boolean
  label: string
}) {
  return (
    <div className="flex gap-3 pt-2">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-2xl">
        Hủy
      </Button>
      <Button type="submit" disabled={isLoading} className="rounded-2xl">
        {isLoading ? 'Đang lưu...' : label}
      </Button>
    </div>
  )
}
