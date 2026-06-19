"use client"

import {
  differenceInDays,
  eachDayOfInterval,
  format,
  isToday,
  isWeekend,
  parseISO,
} from "date-fns"
import { motion } from "framer-motion"
import React from "react"

export interface CalRoom {
  id: string
  room_number: string
  floor: number
  default_price: number
}

export interface CalBooking {
  id: string
  room_id: string
  check_in: string
  check_out: string
  status: string
  source: string
  total_price: number
  deposit_paid: number
  num_adults: number
  num_children: number
  note: string | null
  guest: { full_name: string; phone: string | null } | null
}

export interface CalBlock {
  id: string
  room_id: string
  start_date: string
  end_date: string
  reason: string | null
}

interface TimelineCalendarProps {
  rooms: CalRoom[]
  bookings: CalBooking[]
  blocks: CalBlock[]
  viewStart: Date
  viewEnd: Date
  onBookingClick: (booking: CalBooking) => void
  onBlockClick: (block: CalBlock) => void
  onEmptyCellClick: (roomId: string, date: string) => void
}

const DAY_WIDTH = 64
// Check-in occupies ~3/4 (empty space on left = 18px)
const PAD_LEFT = "18px"
// Check-out occupies 1/4 (empty space on right = 48px)
const PAD_RIGHT = "48px"
const ROOM_COL_WIDTH = 72
const ROW_HEIGHT = 56
const HEADER_HEIGHT = 48

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950",
  checked_in: "bg-emerald-700 text-white",
  checked_out:
    "bg-zinc-200 text-zinc-500 opacity-60 dark:bg-zinc-800 dark:text-zinc-500",
  no_show: "bg-amber-600 text-white",
  cancelled: "bg-red-400 text-white",
}

function getGridPlacement(
  startDate: string,
  endDate: string,
  viewStart: Date,
  viewEnd: Date
) {
  const startStr = startDate.split("T")[0]
  const endStr = endDate.split("T")[0]

  const start = parseISO(startStr)
  const end = parseISO(endStr)

  const viewStartOnly = new Date(
    viewStart.getFullYear(),
    viewStart.getMonth(),
    viewStart.getDate()
  )
  const viewEndOnly = new Date(
    viewEnd.getFullYear(),
    viewEnd.getMonth(),
    viewEnd.getDate()
  )

  let isStartCropped = false
  let effectiveStart = start
  if (start < viewStartOnly) {
    effectiveStart = viewStartOnly
    isStartCropped = true
  }

  let isEndCropped = false
  let effectiveEnd = end
  if (end > viewEndOnly) {
    effectiveEnd = viewEndOnly
    isEndCropped = true
  }

  const startOffset = differenceInDays(effectiveStart, viewStartOnly)
  const span = differenceInDays(effectiveEnd, effectiveStart) + 1

  if (span <= 0) return null

  return { startOffset, span, isStartCropped, isEndCropped }
}

export default function TimelineCalendar({
  rooms,
  bookings,
  blocks,
  viewStart,
  viewEnd,
  onBookingClick,
  onBlockClick,
  onEmptyCellClick,
}: TimelineCalendarProps) {
  const days = eachDayOfInterval({ start: viewStart, end: viewEnd })
  const gridTemplateColumns = `${ROOM_COL_WIDTH}px repeat(${days.length}, ${DAY_WIDTH}px)`

  return (
    <div className="w-full">
      <div className="max-h-[calc(100dvh-300px)] [scrollbar-width:none] overflow-auto overscroll-contain md:max-h-[calc(100dvh-240px)] [&::-webkit-scrollbar]:hidden">
        <div
          style={{ display: "grid", gridTemplateColumns }}
          className="relative min-w-max"
        >
          {/* ── HEADER ── */}
          {/* Corner */}
          <div
            style={{
              gridRow: 1,
              gridColumn: 1,
              height: HEADER_HEIGHT,
              position: "sticky",
              top: 0,
              left: 0,
              zIndex: 30,
            }}
            className="flex items-center justify-center border-r border-b border-white/20 bg-white/90 backdrop-blur-2xl dark:bg-zinc-900/90"
          >
            <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
              {format(viewStart, "MMM yy")}
            </span>
          </div>

          {/* Day headers */}
          {days.map((day, i) => {
            const today = isToday(day)
            return (
              <div
                key={`h-${i}`}
                style={{
                  gridRow: 1,
                  gridColumn: i + 2,
                  height: HEADER_HEIGHT,
                  position: "sticky",
                  top: 0,
                  zIndex: 20,
                }}
                className={`relative flex flex-col items-center justify-center gap-0.5 border-r border-b border-black/5 bg-white/90 backdrop-blur-2xl dark:border-white/5 dark:bg-zinc-900/90 ${
                  today ? "bg-zinc-100/90 dark:bg-zinc-800/90" : ""
                }`}
              >
                <span
                  className={`z-10 text-[10px] leading-none font-medium uppercase ${isWeekend(day) ? "text-rose-400" : "text-zinc-500"}`}
                >
                  {day.getDay() === 0 ? "CN" : `T${day.getDay() + 1}`}
                </span>
                <span
                  className={`z-10 flex h-5 items-center justify-center rounded-full text-[11px] leading-none font-bold ${
                    today
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                      : isWeekend(day)
                        ? "text-rose-500"
                        : "text-zinc-500"
                  }`}
                  style={{
                    width: day.getDate() === 1 ? "auto" : "1.25rem",
                    padding: day.getDate() === 1 ? "0 6px" : "0",
                  }}
                >
                  {format(day, day.getDate() === 1 ? "d/M" : "d")}
                </span>
              </div>
            )
          })}

          {/* ── ROOM ROWS ── */}
          {rooms.map((room, roomIdx) => {
            const gridRow = roomIdx + 2
            const roomBookings = bookings.filter((b) => b.room_id === room.id)
            const roomBlocks = blocks.filter((b) => b.room_id === room.id)

            return (
              <React.Fragment key={room.id}>
                {/* Sticky room label */}
                <div
                  style={{
                    gridRow,
                    gridColumn: 1,
                    height: ROW_HEIGHT,
                    position: "sticky",
                    left: 0,
                    zIndex: 20,
                  }}
                  className="flex items-center border-r border-b border-black/5 bg-white/80 px-3 backdrop-blur-2xl dark:border-white/5 dark:bg-zinc-900/80"
                >
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                    {room.room_number}
                  </span>
                </div>

                {/* Day cells — clickable when empty */}
                {days.map((day, dayIdx) => (
                  <div
                    key={`cell-${room.id}-${dayIdx}`}
                    style={{
                      gridRow,
                      gridColumn: dayIdx + 2,
                      height: ROW_HEIGHT,
                    }}
                    className={`cursor-pointer border-r border-b border-black/5 transition-colors hover:bg-zinc-100/50 dark:border-white/5 dark:hover:bg-zinc-800/50 ${
                      isToday(day)
                        ? "bg-zinc-950/5 dark:bg-white/5"
                        : isWeekend(day)
                          ? "bg-rose-50/20 dark:bg-rose-950/10"
                          : ""
                    }`}
                    onClick={() =>
                      onEmptyCellClick(room.id, format(day, "yyyy-MM-dd"))
                    }
                  />
                ))}

                {/* Block pills */}
                {roomBlocks.map((block) => {
                  const placement = getGridPlacement(
                    block.start_date,
                    block.end_date,
                    viewStart,
                    viewEnd
                  )
                  if (!placement) return null
                  const pLeft = placement.isStartCropped
                    ? "2px"
                    : placement.span === 1
                      ? "2px"
                      : PAD_LEFT
                  const pRight = placement.isEndCropped
                    ? "2px"
                    : placement.span === 1
                      ? "2px"
                      : PAD_RIGHT
                  return (
                    <div
                      key={block.id}
                      style={{
                        gridRow,
                        gridColumn: `${placement.startOffset + 2} / span ${placement.span}`,
                        height: ROW_HEIGHT,
                        zIndex: 10,
                        paddingLeft: pLeft,
                        paddingRight: pRight,
                        pointerEvents: "none",
                      }}
                      className="flex items-center py-2"
                    >
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        onClick={() => onBlockClick(block)}
                        className="flex h-full w-full cursor-pointer items-center truncate rounded-xl px-2 shadow"
                        style={{
                          background:
                            "repeating-linear-gradient(-45deg, #d4d4d8, #d4d4d8 4px, #e4e4e7 4px, #e4e4e7 10px)",
                          pointerEvents: "auto",
                        }}
                        title={block.reason ?? "Khóa phòng"}
                      >
                        <span className="truncate text-[10px] font-semibold text-zinc-600">
                          🔒
                        </span>
                      </motion.button>
                    </div>
                  )
                })}

                {/* Booking pills */}
                {roomBookings.map((booking) => {
                  const placement = getGridPlacement(
                    booking.check_in,
                    booking.check_out,
                    viewStart,
                    viewEnd
                  )
                  if (!placement) return null
                  const todayStr = format(new Date(), "yyyy-MM-dd")
                  const isPast = booking.check_out < todayStr
                  const isCheckedOut =
                    booking.status === "checked_out" || isPast
                  const colorClass = isCheckedOut
                    ? STATUS_COLORS.checked_out
                    : (STATUS_COLORS[booking.status] ?? STATUS_COLORS.confirmed)
                  const pLeft = placement.isStartCropped
                    ? "2px"
                    : placement.span === 1
                      ? "2px"
                      : PAD_LEFT
                  const pRight = placement.isEndCropped
                    ? "2px"
                    : placement.span === 1
                      ? "2px"
                      : PAD_RIGHT
                  return (
                    <div
                      key={booking.id}
                      style={{
                        gridRow,
                        gridColumn: `${placement.startOffset + 2} / span ${placement.span}`,
                        height: ROW_HEIGHT,
                        zIndex: 10,
                        paddingLeft: pLeft,
                        paddingRight: pRight,
                        pointerEvents: "none",
                      }}
                      className="flex items-center py-2"
                    >
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        onClick={() => onBookingClick(booking)}
                        className={`flex h-full w-full cursor-pointer items-center truncate rounded-2xl px-2.5 shadow-lg ${colorClass}`}
                        style={{ pointerEvents: "auto" }}
                      >
                        <span className="truncate text-[11px] font-semibold">
                          {booking.guest?.full_name ?? "—"}
                        </span>
                      </motion.button>
                    </div>
                  )
                })}
              </React.Fragment>
            )
          })}

          {/* ── SUMMARY ROWS ── */}
          {/* Sticky Left Labels */}
          <div
            style={{
              gridRow: rooms.length + 2,
              gridColumn: 1,
              height: ROW_HEIGHT,
              position: "sticky",
              left: 0,
              bottom: ROW_HEIGHT,
              zIndex: 30,
            }}
            className="flex items-center border-t border-r border-b border-black/5 bg-white/95 px-3 backdrop-blur-2xl dark:border-white/5 dark:bg-zinc-900/95"
          >
            <span className="text-[10px] font-bold text-zinc-500 uppercase dark:text-zinc-400">
              Trống
            </span>
          </div>
          <div
            style={{
              gridRow: rooms.length + 3,
              gridColumn: 1,
              height: ROW_HEIGHT,
              position: "sticky",
              left: 0,
              bottom: 0,
              zIndex: 30,
            }}
            className="flex items-center border-r border-b border-black/5 bg-white/95 px-3 backdrop-blur-2xl dark:border-white/5 dark:bg-zinc-900/95"
          >
            <span className="text-[10px] font-bold text-zinc-500 uppercase dark:text-zinc-400">
              Hiệu suất
            </span>
          </div>

          {/* Data Cells */}
          {days.map((day, dayIdx) => {
            const dayStr = format(day, "yyyy-MM-dd")
            let occupiedCount = 0
            for (const room of rooms) {
              const isBooked = bookings.some(
                (b) =>
                  b.room_id === room.id &&
                  b.check_in <= dayStr &&
                  b.check_out > dayStr &&
                  b.status !== "cancelled"
              )
              const isBlocked = blocks.some(
                (b) =>
                  b.room_id === room.id &&
                  b.start_date <= dayStr &&
                  b.end_date > dayStr
              )
              if (isBooked || isBlocked) occupiedCount++
            }
            const available =
              rooms.length > 0 ? rooms.length - occupiedCount : 0
            const occupancy =
              rooms.length > 0
                ? Math.round((occupiedCount / rooms.length) * 100)
                : 0

            return (
              <React.Fragment key={`summary-${dayIdx}`}>
                <div
                  style={{
                    gridRow: rooms.length + 2,
                    gridColumn: dayIdx + 2,
                    height: ROW_HEIGHT,
                    position: "sticky",
                    bottom: ROW_HEIGHT,
                    zIndex: 20,
                  }}
                  className="flex items-center justify-center border-t border-r border-b border-black/5 bg-white/95 backdrop-blur-2xl dark:border-white/5 dark:bg-zinc-900/95"
                >
                  <span
                    className={`text-xs font-bold ${available === 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}
                  >
                    {available}
                  </span>
                </div>
                <div
                  style={{
                    gridRow: rooms.length + 3,
                    gridColumn: dayIdx + 2,
                    height: ROW_HEIGHT,
                    position: "sticky",
                    bottom: 0,
                    zIndex: 20,
                  }}
                  className="flex items-center justify-center border-r border-b border-black/5 bg-white/95 backdrop-blur-2xl dark:border-white/5 dark:bg-zinc-900/95"
                >
                  <span
                    className={`text-[10px] font-semibold ${occupancy === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}
                  >
                    {occupancy}%
                  </span>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
