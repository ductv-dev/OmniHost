"use client"

import { useBuilding } from "@/components/building-context"
import ActionChoiceDrawer from "@/components/calendar/ActionChoiceDrawer"
import BlockRoomDrawer from "@/components/calendar/BlockRoomDrawer"
import BookingDetailDrawer from "@/components/calendar/BookingDetailDrawer"
import CreateBookingDrawer from "@/components/calendar/CreateBookingDrawer"
import TimelineCalendar, {
  type CalBlock,
  type CalBooking,
  type CalRoom,
} from "@/components/calendar/TimelineCalendar"
import { Calendar } from "@/components/ui/calendar"
import { createClient } from "@/lib/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { addDays, format, startOfToday, subDays } from "date-fns"
import { vi } from "date-fns/locale"
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { Drawer } from "vaul"

export default function CalendarPage() {
  const {
    selectedId,
    selectedBuilding,
    loading: buildingLoading,
  } = useBuilding()

  const [selectedDate, setSelectedDate] = useState(() => startOfToday())
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Drawer state
  const [choiceOpen, setChoiceOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)

  const [selectedCell, setSelectedCell] = useState<{
    roomId: string
    date: string
    roomName: string
  } | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<CalBooking | null>(
    null
  )
  const [selectedBlock, setSelectedBlock] = useState<CalBlock | null>(null)

  const viewStart = subDays(selectedDate, 1)
  const viewEnd = addDays(selectedDate, 12)

  const mStart = format(viewStart, "yyyy-MM-dd")
  const mEnd = format(viewEnd, "yyyy-MM-dd")

  const {
    data,
    isLoading: dataLoading,
    refetch: fetchData,
  } = useQuery({
    queryKey: ["calendarData", selectedId, mStart, mEnd],
    queryFn: async () => {
      const supabase = createClient()
      const roomIds =
        (
          await supabase
            .from("rooms")
            .select("id")
            .eq("building_id", selectedId!)
        ).data?.map((r) => r.id) ?? []

      const [roomsResult, bookingsResult, blocksResult] = await Promise.all([
        supabase
          .from("rooms")
          .select("id, room_number, floor, default_price")
          .eq("building_id", selectedId!)
          .eq("is_active", true)
          .order("sort_order")
          .order("room_number"),

        supabase
          .from("bookings")
          .select(
            "id, room_id, check_in, check_out, status, source, total_price, deposit_paid, num_adults, num_children, note, guest:guests(full_name, phone)"
          )
          .eq("building_id", selectedId!)
          .neq("status", "cancelled")
          .lte("check_in", mEnd)
          .gte("check_out", mStart),

        roomIds.length > 0
          ? supabase
              .from("room_blocks")
              .select("id, room_id, start_date, end_date, reason")
              .in("room_id", roomIds)
              .lte("start_date", mEnd)
              .gte("end_date", mStart)
          : Promise.resolve({ data: [] }),
      ])

      return {
        rooms: (roomsResult.data ?? []) as CalRoom[],
        bookings: (bookingsResult.data ?? []) as unknown as CalBooking[],
        blocks: (blocksResult.data ?? []) as CalBlock[],
      }
    },
    enabled: !!selectedId,
  })

  const rooms = data?.rooms ?? []
  const bookings = data?.bookings ?? []
  const blocks = data?.blocks ?? []

  // ── Click handlers ──

  function handleEmptyCellClick(roomId: string, date: string) {
    const room = rooms.find((r) => r.id === roomId)
    setSelectedCell({ roomId, date, roomName: room?.room_number ?? "" })
    setChoiceOpen(true)
  }

  function handleBookingClick(booking: CalBooking) {
    setSelectedBooking(booking)
    setDetailOpen(true)
  }

  function handleBlockClick(block: CalBlock) {
    setSelectedBlock(block)
    setBlockOpen(true)
  }

  // ── Drawer transitions ──

  function handleChooseBook() {
    setChoiceOpen(false)
    setTimeout(() => setCreateOpen(true), 150)
  }

  function handleChooseBlock() {
    setChoiceOpen(false)
    setTimeout(() => setBlockOpen(true), 150)
  }

  // ── No building selected state ──

  if (buildingLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
      </div>
    )
  }

  if (!selectedId) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <Building2 className="size-7 text-zinc-400" />
        </div>
        <div>
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">
            Chưa có tòa nhà
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Nhấn menu để chọn tòa nhà
          </p>
        </div>
      </div>
    )
  }

  const selectedRoom = selectedCell
    ? (rooms.find((r) => r.id === selectedCell.roomId) ?? null)
    : null
  const selectedBlockRoom = selectedBlock
    ? (rooms.find((r) => r.id === selectedBlock.room_id) ?? null)
    : null
  const selectedBookingRoom = selectedBooking
    ? (rooms.find((r) => r.id === selectedBooking.room_id) ?? null)
    : null

  return (
    <>
      <div className="space-y-3">
        {/* Month navigator */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-zinc-500">{selectedBuilding?.name}</p>
            <h1 className="text-xl font-bold tracking-tight capitalize">
              {format(selectedDate, "MMMM yyyy", { locale: vi })}
            </h1>
          </div>
          <div className="flex flex-wrap justify-start gap-1.5 sm:justify-end">
            <button
              onClick={() => setSelectedDate(startOfToday())}
              className="flex h-10 items-center justify-center rounded-xl bg-zinc-100 px-3 text-xs font-semibold text-zinc-600 transition-colors active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Hôm nay
            </button>
            <button
              onClick={() => setSelectedDate((d) => subDays(d, 14))}
              className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition-colors active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => setDatePickerOpen(true)}
              className="flex h-10 items-center justify-center rounded-xl bg-zinc-100 px-3 text-xs font-semibold text-zinc-600 transition-colors active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <CalendarDays className="mr-2 size-4 text-zinc-400" />
              {format(selectedDate, "dd/MM")}
            </button>
            <button
              onClick={() => setSelectedDate((d) => addDays(d, 14))}
              className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition-colors active:scale-95 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {dataLoading ? (
          <div className="space-y-2 overflow-hidden rounded-[2rem] border border-white/20 bg-white/40 p-4 shadow-xl backdrop-blur-3xl dark:bg-zinc-900/40">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-[2rem] border border-white/20 bg-white/40 shadow-xl backdrop-blur-3xl dark:bg-zinc-900/40">
            <p className="text-sm font-semibold text-zinc-500">
              Tòa nhà chưa có phòng
            </p>
            <p className="text-xs text-zinc-400">
              Thêm phòng trong mục Tòa nhà
            </p>
          </div>
        ) : (
          <div className="-mx-4">
            <TimelineCalendar
              rooms={rooms}
              bookings={bookings}
              blocks={blocks}
              viewStart={viewStart}
              viewEnd={viewEnd}
              onBookingClick={handleBookingClick}
              onBlockClick={handleBlockClick}
              onEmptyCellClick={handleEmptyCellClick}
            />
          </div>
        )}
      </div>

      {/* ── Drawers ── */}
      <ActionChoiceDrawer
        open={choiceOpen}
        onOpenChange={setChoiceOpen}
        roomName={selectedCell?.roomName ?? ""}
        date={selectedCell?.date ?? format(new Date(), "yyyy-MM-dd")}
        onBook={handleChooseBook}
        onBlock={handleChooseBlock}
      />

      <CreateBookingDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        buildingId={selectedId}
        rooms={rooms}
        bookings={bookings}
        defaultRoomId={selectedCell?.roomId ?? rooms[0]?.id ?? ""}
        defaultCheckIn={selectedCell?.date ?? format(new Date(), "yyyy-MM-dd")}
        onSuccess={() => fetchData()}
      />

      <BookingDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        booking={selectedBooking}
        room={selectedBookingRoom}
        onSuccess={() => fetchData()}
      />

      <BlockRoomDrawer
        open={blockOpen}
        onOpenChange={setBlockOpen}
        room={selectedBlock ? selectedBlockRoom : selectedRoom}
        defaultStartDate={
          selectedBlock?.start_date ??
          selectedCell?.date ??
          format(new Date(), "yyyy-MM-dd")
        }
        existingBlock={selectedBlock}
        onSuccess={() => {
          fetchData()
          setSelectedBlock(null)
        }}
      />

      <Drawer.Root open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
          <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[60] flex max-h-[92dvh] flex-col rounded-t-[2rem] border-t border-white/20 bg-white shadow-2xl dark:bg-zinc-950">
            <div className="shrink-0 px-5 pt-4 pb-3">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <Drawer.Title className="text-center text-base font-bold">
                Chọn ngày
              </Drawer.Title>
            </div>
            <div className="flex flex-1 items-start justify-center overflow-y-auto px-2 pb-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  if (d) {
                    setSelectedDate(d)
                    setDatePickerOpen(false)
                  }
                }}
                locale={vi}
                classNames={{
                  root: "w-full",
                  month_grid: "w-full",
                  weekday: "flex-1 text-center text-xs text-zinc-400 py-1",
                  week: "flex w-full",
                  day: "flex-1 text-center",
                }}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}
