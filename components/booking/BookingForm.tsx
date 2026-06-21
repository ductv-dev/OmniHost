'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { differenceInDays, parseISO, format } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createBooking } from '@/app/dashboard/bookings/actions'
import SourceIcon from '@/components/booking/SourceIcon'
import type { BookingSource, BuildingForBooking, RoomForBooking } from '@/types/booking'

const formSchema = z
  .object({
    building_id: z.string().min(1, 'Chọn tòa nhà'),
    room_id: z.string().min(1, 'Chọn phòng'),
    check_in: z.string().min(1, 'Chọn ngày nhận phòng'),
    check_out: z.string().min(1, 'Chọn ngày trả phòng'),
    check_in_time: z.string().default('14:00'),
    check_out_time: z.string().default('12:00'),
    guest_full_name: z.string().min(1, 'Tên khách là bắt buộc'),
    guest_phone: z.string().optional().or(z.literal('')),
    guest_email: z.string().optional().or(z.literal('')),
    guest_country: z.string().optional().or(z.literal('')),
    source: z.enum(['airbnb', 'booking', 'agoda', 'direct', 'facebook', 'tiktok']),
    guest_type: z.enum(['short_stay', 'long_stay']),
    num_adults: z.coerce.number().int().min(1),
    num_children: z.coerce.number().int().min(0),
    total_price: z.coerce.number().min(0),
    deposit_paid: z.coerce.number().min(0),
    note: z.string().optional().or(z.literal('')),
  })
  .refine((d) => !d.check_in || !d.check_out || d.check_out > d.check_in, {
    message: 'Ngày trả phòng phải sau ngày nhận phòng',
    path: ['check_out'],
  })
  .refine((d) => d.deposit_paid <= d.total_price, {
    message: 'Tiền cọc không được lớn hơn tổng tiền',
    path: ['deposit_paid'],
  })

type FormValues = z.infer<typeof formSchema>

const SOURCE_OPTIONS = [
  { value: 'direct', label: 'Khách lẻ' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking', label: 'Booking.com' },
  { value: 'agoda', label: 'Agoda' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
] as const

interface Props {
  buildings: BuildingForBooking[]
}

export default function BookingForm({ buildings }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [rooms, setRooms] = useState<RoomForBooking[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      check_in_time: '14:00',
      check_out_time: '12:00',
      source: 'direct',
      guest_type: 'short_stay',
      num_adults: 1,
      num_children: 0,
      total_price: 0,
      deposit_paid: 0,
    },
  })

  const watchBuildingId = watch('building_id')
  const watchSource = watch('source')
  const watchRoomId = watch('room_id')
  const watchCheckIn = watch('check_in')
  const watchCheckOut = watch('check_out')

  // Filter rooms when building changes
  useEffect(() => {
    const building = buildings.find((b) => b.id === watchBuildingId)
    const activeRooms = building?.rooms.filter((r) => r.is_active) ?? []
    setRooms(activeRooms)
    setValue('room_id', '')
    setValue('total_price', 0)
  }, [watchBuildingId, buildings, setValue])

  // Recalculate price when room or dates change
  useEffect(() => {
    if (!watchRoomId || !watchCheckIn || !watchCheckOut || watchCheckOut <= watchCheckIn) return
    const room = rooms.find((r) => r.id === watchRoomId)
    if (!room) return
    const nights = differenceInDays(parseISO(watchCheckOut), parseISO(watchCheckIn))
    setValue('total_price', room.default_price * nights)
  }, [watchRoomId, watchCheckIn, watchCheckOut, rooms, setValue])

  const nights =
    watchCheckIn && watchCheckOut && watchCheckOut > watchCheckIn
      ? differenceInDays(parseISO(watchCheckOut), parseISO(watchCheckIn))
      : 0

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    const result = await createBooking({
      building_id: values.building_id,
      room_id: values.room_id,
      guest_full_name: values.guest_full_name,
      guest_phone: values.guest_phone || undefined,
      guest_email: values.guest_email || undefined,
      guest_country: values.guest_country || undefined,
      source: values.source,
      guest_type: values.guest_type,
      check_in: values.check_in,
      check_out: values.check_out,
      check_in_time: values.check_in_time,
      check_out_time: values.check_out_time,
      num_adults: values.num_adults,
      num_children: values.num_children,
      total_price: values.total_price,
      deposit_paid: values.deposit_paid,
      note: values.note || undefined,
    })
    if ('error' in result) {
      setServerError(result.error)
      return
    }
    router.push(`/dashboard/bookings/${result.bookingId}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-10">
      {/* ── Phòng & Ngày ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Phòng & Ngày
        </h2>

        {/* Building */}
        <div className="space-y-1.5">
          <Label>Tòa nhà</Label>
          <Select
            onValueChange={(v) => setValue('building_id', v, { shouldValidate: true })}
          >
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Chọn tòa nhà…" />
            </SelectTrigger>
            <SelectContent>
              {buildings.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.building_id && (
            <p className="text-xs text-red-500">{errors.building_id.message}</p>
          )}
        </div>

        {/* Room */}
        <div className="space-y-1.5">
          <Label>Phòng</Label>
          <Select
            disabled={rooms.length === 0}
            onValueChange={(v) => setValue('room_id', v, { shouldValidate: true })}
          >
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue
                placeholder={rooms.length === 0 ? 'Chọn tòa nhà trước…' : 'Chọn phòng…'}
              />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.room_number}
                  {r.default_price > 0 && (
                    <span className="ml-2 text-zinc-400">
                      {r.default_price.toLocaleString('vi-VN')}đ/đêm
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.room_id && (
            <p className="text-xs text-red-500">{errors.room_id.message}</p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nhận phòng</Label>
            <Input
              type="date"
              min={todayStr}
              className="h-12 rounded-2xl"
              {...register('check_in')}
            />
            {errors.check_in && (
              <p className="text-xs text-red-500">{errors.check_in.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Trả phòng</Label>
            <Input
              type="date"
              min={watchCheckIn || todayStr}
              className="h-12 rounded-2xl"
              {...register('check_out')}
            />
            {errors.check_out && (
              <p className="text-xs text-red-500">{errors.check_out.message}</p>
            )}
          </div>
        </div>

        {/* Nights summary */}
        {nights > 0 && (
          <div className="flex items-center justify-between rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
            <span className="text-sm text-zinc-500">{nights} đêm</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-white">
              {watch('total_price').toLocaleString('vi-VN')}đ
            </span>
          </div>
        )}

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Giờ nhận</Label>
            <Input type="time" className="h-12 rounded-2xl" {...register('check_in_time')} />
          </div>
          <div className="space-y-1.5">
            <Label>Giờ trả</Label>
            <Input type="time" className="h-12 rounded-2xl" {...register('check_out_time')} />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Thông tin khách ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Thông tin khách
        </h2>

        <div className="space-y-1.5">
          <Label>Tên khách *</Label>
          <Input
            placeholder="Nguyễn Văn A"
            className="h-12 rounded-2xl"
            {...register('guest_full_name')}
          />
          {errors.guest_full_name && (
            <p className="text-xs text-red-500">{errors.guest_full_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Số điện thoại</Label>
          <Input
            type="tel"
            placeholder="+84 xxx xxx xxx"
            className="h-12 rounded-2xl"
            {...register('guest_phone')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="email@example.com"
              className="h-12 rounded-2xl"
              {...register('guest_email')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Quốc tịch</Label>
            <Input
              placeholder="VN, KR, US…"
              className="h-12 rounded-2xl"
              {...register('guest_country')}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Chi tiết đặt phòng ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Chi tiết đặt phòng
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nguồn</Label>
            <Select
              defaultValue="direct"
              onValueChange={(v) => setValue('source', v as FormValues['source'])}
            >
              <SelectTrigger className="h-12 rounded-2xl">
                <span className="flex items-center gap-2">
                  <SourceIcon source={watchSource as BookingSource} size={14} />
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <span className="flex items-center gap-2">
                      <SourceIcon source={o.value as BookingSource} size={14} />
                      {o.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Loại khách</Label>
            <Select
              defaultValue="short_stay"
              onValueChange={(v) => setValue('guest_type', v as FormValues['guest_type'])}
            >
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short_stay">Ngắn ngày</SelectItem>
                <SelectItem value="long_stay">Dài ngày</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Người lớn</Label>
            <Input
              type="number"
              min={1}
              className="h-12 rounded-2xl"
              {...register('num_adults')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Trẻ em</Label>
            <Input
              type="number"
              min={0}
              className="h-12 rounded-2xl"
              {...register('num_children')}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Thanh toán ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Thanh toán
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Tổng tiền (VND)</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              className="h-12 rounded-2xl"
              {...register('total_price')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tiền cọc (VND)</Label>
            <Input
              type="number"
              min={0}
              step={1000}
              className="h-12 rounded-2xl"
              {...register('deposit_paid')}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Ghi chú ── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Ghi chú
        </h2>
        <Textarea
          placeholder="Yêu cầu đặc biệt, lưu ý từ khách…"
          className="min-h-24 rounded-2xl"
          {...register('note')}
        />
      </section>

      {/* Error */}
      {serverError && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-14 w-full rounded-2xl text-base font-semibold"
      >
        {isSubmitting ? 'Đang lưu…' : 'Tạo booking'}
      </Button>
    </form>
  )
}
