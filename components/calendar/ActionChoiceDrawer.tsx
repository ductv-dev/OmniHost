'use client'

import { Drawer } from 'vaul'
import { Banknote, CalendarPlus, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'

interface ActionChoiceDrawerProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  roomName: string
  date: string
  onBook: () => void
  onBlock: () => void
  onSetRate: () => void
}

export default function ActionChoiceDrawer({
  open,
  onOpenChange,
  roomName,
  date,
  onBook,
  onBlock,
  onSetRate,
}: ActionChoiceDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] border-t border-white/20 bg-white/95 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900/95"
          aria-label="Chọn hành động"
        >
          <div className="px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <Drawer.Title className="text-lg font-bold text-zinc-950 dark:text-white">
              {roomName}
            </Drawer.Title>
            <p className="mb-6 mt-0.5 text-sm text-zinc-500">
              {format(parseISO(date), 'EEEE, dd/MM/yyyy')}
            </p>

            <div className="grid grid-cols-3 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={onBook}
                className="flex flex-col items-center gap-3 rounded-2xl bg-zinc-950 px-3 py-5 text-white dark:bg-white dark:text-zinc-950"
              >
                <CalendarPlus className="size-6" />
                <span className="text-xs font-bold">Đặt phòng</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={onBlock}
                className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-5 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <Lock className="size-6" />
                <span className="text-xs font-bold">Khóa phòng</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={onSetRate}
                className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-5 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
              >
                <Banknote className="size-6" />
                <span className="text-xs font-bold">Đặt giá</span>
              </motion.button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
