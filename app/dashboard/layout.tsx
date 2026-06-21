'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, CalendarDays, MessageSquare, LogOut, AlignJustify, CalendarCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BuildingProvider, useBuilding } from '@/components/building-context'
import BuildingPicker from '@/components/building-picker'
import AppSidebar from '@/components/sidebar/AppSidebar'

const staticNavItems = [
  { href: '/dashboard/today',        icon: CalendarCheck, label: 'Hôm nay' },
  { href: '/dashboard/calendar',     icon: CalendarDays,  label: 'Lịch' },
  { href: '/dashboard/generator',    icon: MessageSquare, label: 'Tin nhắn' },
  { href: '/dashboard/my-building',  icon: Building2,     label: 'Tòa nhà' },
]

function BuildingTab() {
  const { selectedBuilding } = useBuilding()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-1.5 rounded-xl bg-zinc-100 px-3 text-sm font-semibold transition-colors active:scale-95 dark:bg-zinc-900"
      >
        <Building2 className="size-4 shrink-0 text-zinc-500" />
        <span className="max-w-28 truncate text-zinc-700 dark:text-zinc-300">
          {selectedBuilding?.name ?? 'Tòa nhà'}
        </span>
      </button>

      <BuildingPicker open={open} onOpenChange={setOpen} />
    </>
  )
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => setIsSuperAdmin(profile?.is_super_admin ?? false))
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-dvh bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isSuperAdmin={isSuperAdmin} />

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

        {/* Bottom nav — 5 tabs */}
        <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-130 -translate-x-1/2 border-t border-zinc-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="grid grid-cols-5 gap-1">
            {staticNavItems.map(item => {
              const isActive =
                item.href === '/dashboard/my-building'
                  ? pathname.startsWith('/dashboard/my-building') || pathname.startsWith('/dashboard/buildings')
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-colors active:scale-95 ${
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
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-colors hover:bg-zinc-50 active:scale-95 dark:hover:bg-zinc-900/50"
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
