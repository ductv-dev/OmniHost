'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, FileText, Home, MessageSquare, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  
  const navItems = [
    { href: '/dashboard/generator', icon: MessageSquare, label: 'Messages' },
    { href: '/dashboard/templates', icon: FileText, label: 'Templates' },
    { href: '/dashboard/buildings', icon: Building2, label: 'Buildings' },
  ]

  const currentItem = navItems.find(item => pathname.startsWith(item.href))

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-dvh bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col bg-white shadow-2xl shadow-zinc-950/5 dark:bg-zinc-950">
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="flex items-center justify-between">
            <Link href="/dashboard/generator" className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                <Home className="size-5" />
              </div>
              <div>
                <p className="text-base font-semibold leading-tight">OmniHost</p>
                <p className="text-xs text-zinc-500">
                  {currentItem?.label || 'Mobile workspace'}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-colors active:scale-95 dark:bg-zinc-900"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden px-4 py-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))]">
          <div>
              {children}
          </div>
        </main>

        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[520px] -translate-x-1/2 border-t border-zinc-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} className="relative flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-2">
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    className="relative z-10 flex flex-col items-center gap-1"
                  >
                    <item.icon className={`size-5 transition-colors ${isActive ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'}`} />
                    <span className={`text-[11px] font-semibold leading-none transition-colors ${isActive ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'}`}>
                      {item.label}
                    </span>
                  </motion.div>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-pill"
                      className="absolute inset-0 rounded-2xl bg-zinc-100 dark:bg-zinc-900"
                      transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
