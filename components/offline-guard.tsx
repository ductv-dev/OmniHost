'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, WifiOff } from 'lucide-react'
import { LumaMark } from '@/components/brand/luma-mark'
import { Button } from '@/components/ui/button'

export function OfflineGuard() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const syncConnection = () => setOffline(!navigator.onLine)
    syncConnection()
    window.addEventListener('online', syncConnection)
    window.addEventListener('offline', syncConnection)
    return () => {
      window.removeEventListener('online', syncConnection)
      window.removeEventListener('offline', syncConnection)
    }
  }, [])

  if (!offline) return null

  return (
    <div role="alert" aria-live="assertive" className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center bg-zinc-950 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
      <div className="w-full max-w-sm text-center">
        <LumaMark className="mx-auto size-20" inverted />
        <span className="mx-auto mt-8 flex size-12 items-center justify-center rounded-2xl bg-white/10 text-zinc-300"><WifiOff className="size-6" /></span>
        <h1 className="mt-5 text-2xl font-black tracking-tight">Không có kết nối mạng</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Kiểm tra Wi-Fi hoặc dữ liệu di động rồi thử lại. OmniHost không hiển thị dữ liệu đã lưu cũ khi offline.</p>
        <Button type="button" variant="outline" className="mt-7 h-12 w-full rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white" onClick={() => window.location.reload()}>
          <RefreshCw /> Thử kết nối lại
        </Button>
      </div>
    </div>
  )
}
