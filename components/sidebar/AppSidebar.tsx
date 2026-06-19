'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Building2, FileText, Plus, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface NavLink {
  href: string
  icon: React.ElementType
  label: string
  sub?: boolean
}

const NAV_SECTIONS: { title: string; links: NavLink[] }[] = [
  {
    title: 'Tòa nhà & phòng',
    links: [
      { href: '/dashboard/buildings', icon: Building2, label: 'Tòa nhà & phòng' },
    ],
  },
  {
    title: 'Tin nhắn',
    links: [
      { href: '/dashboard/templates',     icon: FileText,    label: 'Mẫu tin nhắn' },
      { href: '/dashboard/templates/new', icon: Plus,        label: 'Tạo template mới', sub: true },
      { href: '/dashboard/generator',     icon: MessageSquare, label: 'Sinh tin nhắn' },
    ],
  },
]

interface AppSidebarProps {
  open: boolean
  onClose: () => void
}

export default function AppSidebar({ open, onClose }: AppSidebarProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col bg-white shadow-2xl dark:bg-zinc-950"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] dark:border-zinc-800">
              <span className="text-base font-bold tracking-tight">Menu</span>
              <button
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors active:scale-95 dark:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Nav sections */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {NAV_SECTIONS.map(section => (
                <div key={section.title}>
                  <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.links.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors active:scale-95 ${
                          link.sub
                            ? 'text-zinc-500 hover:bg-zinc-50 dark:text-zinc-500 dark:hover:bg-zinc-900'
                            : 'text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <link.icon className={`size-4 shrink-0 ${link.sub ? 'text-zinc-400' : 'text-zinc-500'}`} />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pb-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
