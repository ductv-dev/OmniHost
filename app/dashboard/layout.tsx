'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, FileText, MessageSquare, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  
  const navItems = [
    { href: '/dashboard/buildings', icon: Building2, label: 'Buildings' },
    { href: '/dashboard/templates', icon: FileText, label: 'Templates' },
    { href: '/dashboard/generator', icon: MessageSquare, label: 'Messages' },
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950 lg:block">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="text-base font-semibold leading-tight">OmniHost</p>
              <p className="text-xs text-zinc-500">Message workspace</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="absolute bottom-5 left-4 right-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-zinc-950 lg:bg-zinc-50 lg:dark:bg-zinc-950">
          <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                <Building2 className="size-4" />
              </div>
              <span className="text-lg font-semibold tracking-tight">OmniHost</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-zinc-500">Host operations</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-zinc-900 dark:hover:bg-red-950/30"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </header>

          <main className="flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

          <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 lg:hidden">
          <nav className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white/90 p-1.5 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} className="relative flex-1 flex flex-col items-center justify-center rounded-lg p-2">
                  <motion.div 
                    whileTap={{ scale: 0.8 }}
                    className="relative z-10 flex flex-col items-center gap-1"
                  >
                    <item.icon className={`size-5 transition-colors duration-300 ${isActive ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'}`} />
                    <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'}`}>
                      {item.label}
                    </span>
                  </motion.div>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-zinc-100 dark:bg-zinc-900"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
