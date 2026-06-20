'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, CalendarDays, MessageSquare, LogOut, Check, AlignJustify } from 'lucide-react'
import { Drawer } from 'vaul'
import { createClient } from '@/lib/supabase/client'
import { BuildingProvider, useBuilding } from '@/components/building-context'
import AppSidebar from '@/components/sidebar/AppSidebar'

const navItems = [
  { href: '/dashboard/calendar',   icon: CalendarDays,  label: 'Lịch' },
  { href: '/dashboard/generator',  icon: MessageSquare, label: 'Tin nhắn' },
  { href: '/dashboard/buildings',  icon: Building2,     label: 'Tòa nhà' },
]

function BuildingTab() {
  const { buildings, selectedId, selectedBuilding, setSelectedId } = useBuilding()
  const [open, setOpen] = useState(false)

  const shortName = selectedBuilding?.name ?? 'Tòa nhà'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-1.5 rounded-xl bg-zinc-100 px-3 text-sm font-semibold transition-colors active:scale-95 dark:bg-zinc-900"
      >
        <Building2 className="size-4 shrink-0 text-zinc-500" />
        <span className="max-w-28 truncate text-zinc-700 dark:text-zinc-300">
          {shortName}
        </span>
      </button>

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] border-t border-white/20 bg-white/95 shadow-2xl backdrop-blur-3xl dark:bg-zinc-900/95"
            aria-label="Chọn tòa nhà"
          >
            <div className="px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <Drawer.Title className="mb-4 text-base font-bold text-zinc-950 dark:text-white">
                Chọn tòa nhà
              </Drawer.Title>
              <div className="space-y-2">
                {buildings.map(b => {
                  const isSelected = b.id === selectedId
                  return (
                    <button
                      key={b.id}
                      onClick={() => { setSelectedId(b.id); setOpen(false) }}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                          : 'bg-zinc-50 text-zinc-700 active:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      <span className="flex-1 text-sm font-semibold">{b.name}</span>
                      {isSelected && <Check className="size-4 shrink-0" />}
                    </button>
                  )
                })}
                {buildings.length === 0 && (
                  <p className="py-4 text-center text-sm text-zinc-400">Chưa có tòa nhà nào</p>
                )}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-dvh bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-130 flex-col bg-white shadow-2xl shadow-zinc-950/5 dark:bg-zinc-950">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
          <span className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">OmniHost</span>
          <div className="flex items-center gap-2">
            <BuildingTab />
            <button
              onClick={handleLogout}
              className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-colors active:scale-95 dark:bg-zinc-900"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>

        {/* Bottom nav — 4 tabs */}
        <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-130 -translate-x-1/2 border-t border-zinc-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="grid grid-cols-4 gap-1">
            {navItems.map(item => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-colors active:scale-95 ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-900'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <item.icon className={`size-5 transition-colors ${isActive ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'}`} />
                  <span className={`text-[11px] font-semibold leading-none transition-colors ${isActive ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}

            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-colors hover:bg-zinc-50 active:scale-95 dark:hover:bg-zinc-900/50"
            >
              <AlignJustify className="size-5 text-zinc-500" />
              <span className="text-[11px] font-semibold leading-none text-zinc-500">Menu</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <BuildingProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </BuildingProvider>
  )
}
