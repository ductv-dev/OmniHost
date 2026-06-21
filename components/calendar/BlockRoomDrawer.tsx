"use client"

import {
  createRoomBlock,
  deleteRoomBlock,
} from "@/app/dashboard/bookings/actions"
import { Trash2, X } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { CalBlock, CalRoom } from "./TimelineCalendar"

interface BlockRoomDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  room: CalRoom | null
  defaultStartDate: string
  existingBlock?: CalBlock | null
  onSuccess: () => void
}

export default function BlockRoomDrawer({
  open,
  onOpenChange,
  room,
  defaultStartDate,
  existingBlock,
  onSuccess,
}: BlockRoomDrawerProps) {
  const [startDate, setStartDate] = useState(existingBlock?.start_date ?? defaultStartDate)
  const [endDate, setEndDate] = useState(existingBlock?.end_date ?? "")
  const [reason, setReason] = useState(existingBlock?.reason ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isViewMode = !!existingBlock

  async function handleCreate() {
    if (!startDate || !endDate) {
      setError("Vui lòng chọn khoảng ngày")
      return
    }
    if (endDate <= startDate) {
      setError("Ngày kết thúc phải sau ngày bắt đầu")
      return
    }
    if (!room) return

    setLoading(true)
    setError(null)
    const result = await createRoomBlock({
      room_id: room.id,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim() || undefined,
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
    if (!existingBlock) return
    setLoading(true)
    const result = await deleteRoomBlock(existingBlock.id)
    setLoading(false)
    if ("error" in result) {
      setError(result.error)
    } else {
      onOpenChange(false)
      setConfirmDelete(false)
      onSuccess()
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) setConfirmDelete(false)
      }}
    >
        <DialogContent
          key={open ? (existingBlock?.id ?? defaultStartDate) : "closed"}
          className="flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-white/95 p-0 backdrop-blur-3xl dark:bg-zinc-900/95 sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-2xl sm:border"
          aria-label={isViewMode ? "Chi tiết khóa phòng" : "Khóa phòng"}
        >
          <div className="shrink-0 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-zinc-950 dark:text-white">
                  {isViewMode ? "Phòng đã khóa" : "Khóa phòng"}
                </DialogTitle>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {room?.room_number}
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

          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="space-y-4">
                {error && (
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                    {error}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="px-1 text-xs font-semibold text-zinc-500">
                      Từ ngày
                    </label>
                    <input
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      type="date"
                      readOnly={isViewMode}
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
                      readOnly={isViewMode}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="px-1 text-xs font-semibold text-zinc-500">
                    Lý do khóa
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Vệ sinh, sửa chữa, giữ phòng..."
                    rows={3}
                    readOnly={isViewMode}
                    className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm transition-colors outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  {isViewMode ? (
                    !confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 text-sm font-semibold text-red-600 dark:border-red-900 dark:text-red-400"
                      >
                        <Trash2 className="size-4" />
                        Mở khóa phòng
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-red-200 p-4 dark:border-red-900">
                        <p className="mb-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
                          Xác nhận mở khóa phòng này?
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
                            disabled={loading}
                            className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {loading ? "…" : "Mở khóa"}
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={handleCreate}
                      disabled={loading}
                      className="h-14 w-full rounded-2xl bg-zinc-950 text-base font-bold text-white transition-transform active:scale-95 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
                    >
                      {loading ? "Đang lưu…" : "Khóa phòng"}
                    </button>
                  )}
                </div>
              </div>
            </div>
        </DialogContent>
    </Dialog>
  )
}
