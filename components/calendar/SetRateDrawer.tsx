"use client"

import {
  deleteRoomRates,
  upsertRoomRates,
} from "@/app/dashboard/bookings/actions"
import { Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Drawer } from "vaul"
import type { CalRoom } from "./TimelineCalendar"

interface SetRateDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  room: CalRoom | null
  rooms: CalRoom[]
  defaultDate: string
  onSuccess: () => void
}

export default function SetRateDrawer({
  open,
  onOpenChange,
  room,
  rooms,
  defaultDate,
  onSuccess,
}: SetRateDrawerProps) {
  const [startDate, setStartDate] = useState(defaultDate)
  const [endDate, setEndDate] = useState(defaultDate)
  const [price, setPrice] = useState("")
  const [applyAll, setApplyAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Reset form whenever the drawer opens with a new date/room
  useEffect(() => {
    if (open) {
      setStartDate(defaultDate)
      setEndDate(defaultDate)
      setPrice("")
      setApplyAll(false)
      setError(null)
      setConfirmDelete(false)
    }
  }, [open, defaultDate])

  const inputClass =
    "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"

  const roomIds = applyAll ? rooms.map((r) => r.id) : room ? [room.id] : []

  async function handleSave() {
    const priceNum = Number(String(price).replace(/[^0-9]/g, ""))
    if (!priceNum || priceNum <= 0) {
      setError("Vui lòng nhập giá hợp lệ")
      return
    }
    if (!startDate || !endDate) {
      setError("Vui lòng chọn khoảng ngày")
      return
    }
    if (endDate < startDate) {
      setError("Ngày kết thúc phải từ ngày bắt đầu trở đi")
      return
    }
    if (roomIds.length === 0) return

    setLoading(true)
    setError(null)
    const result = await upsertRoomRates({
      roomIds,
      startDate,
      endDate,
      price: priceNum,
    })
    setLoading(false)

    if ("error" in result) {
      setError(result.error)
    } else {
      onOpenChange(false)
      onSuccess()
    }
  }

  async function handleDelete() {
    if (roomIds.length === 0) return
    setDeleting(true)
    const result = await deleteRoomRates({ roomIds, startDate, endDate })
    setDeleting(false)
    if ("error" in result) {
      setError(result.error)
    } else {
      onOpenChange(false)
      setConfirmDelete(false)
      onSuccess()
    }
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) setConfirmDelete(false)
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed right-0 bottom-0 left-0 z-60 flex max-h-[92dvh] flex-col rounded-t-[2rem] border-t border-white/20 bg-white/95 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900/95"
          aria-label="Đặt giá phòng"
        >
          <div className="shrink-0 px-5 pt-4">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="flex items-center justify-between">
              <div>
                <Drawer.Title className="text-lg font-bold text-zinc-950 dark:text-white">
                  Đặt giá
                </Drawer.Title>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {room?.room_number ?? ""}
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-4">
              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="space-y-1.5">
                <label className="px-1 text-xs font-semibold text-zinc-500">
                  Giá mỗi đêm (VNĐ)
                </label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  min={0}
                  step={50000}
                  placeholder="500000"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="px-1 text-xs font-semibold text-zinc-500">
                    Từ ngày
                  </label>
                  <input
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    type="date"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="px-1 text-xs font-semibold text-zinc-500">
                    Đến ngày
                  </label>
                  <input
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    type="date"
                    min={startDate || undefined}
                    className={inputClass}
                  />
                </div>
              </div>

              {rooms.length > 1 && (
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={applyAll}
                    onChange={(e) => setApplyAll(e.target.checked)}
                    className="size-4 rounded accent-zinc-900 dark:accent-white"
                  />
                  <span className="text-sm font-medium">
                    Áp dụng cho tất cả {rooms.length} phòng
                  </span>
                </label>
              )}
            </div>
          </div>

          <div className="shrink-0 space-y-2 border-t border-zinc-100 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
            {!confirmDelete ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-zinc-950 text-base font-bold text-white transition-transform active:scale-95 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
                >
                  {loading ? "Đang lưu…" : "Lưu giá"}
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex h-10 w-full items-center justify-center gap-1.5 text-sm font-medium text-zinc-400"
                >
                  <Trash2 className="size-3.5" />
                  Xóa giá custom trong khoảng này
                </button>
              </>
            ) : (
              <div className="rounded-2xl border border-red-200 p-4 dark:border-red-900">
                <p className="mb-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  Xóa giá custom? Phòng sẽ dùng giá mặc định.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="h-11 flex-1 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    Không
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {deleting ? "…" : "Xóa"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
