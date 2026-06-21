'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PageState = 'checking' | 'ready' | 'saving' | 'success' | 'invalid'

export default function AcceptInviteForm() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('checking')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function checkInviteSession() {
      const hash = new URLSearchParams(window.location.hash.slice(1))
      const query = new URLSearchParams(window.location.search)
      const authError = hash.get('error_description') ?? query.get('error_description')

      if (authError) {
        if (active) {
          setError(decodeURIComponent(authError.replaceAll('+', ' ')))
          setPageState('invalid')
        }
        return
      }

      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      if (accessToken && refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (setSessionError && active) {
          setError(setSessionError.message)
          setPageState('invalid')
          return
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession()
      if (!active) return

      if (sessionError || !data.session) {
        setError('Liên kết mời không hợp lệ hoặc đã hết hạn. Hãy yêu cầu super admin gửi lại lời mời.')
        setPageState('invalid')
        return
      }

      setPageState('ready')
    }

    void checkInviteSession()
    return () => { active = false }
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Mật khẩu cần ít nhất 8 ký tự')
      return
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Mật khẩu cần có cả chữ và số')
      return
    }
    if (password !== confirmation) {
      setError('Hai mật khẩu chưa khớp nhau')
      return
    }

    setPageState('saving')
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setPageState('ready')
      return
    }

    setPageState('success')
    window.setTimeout(() => {
      router.replace('/dashboard')
      router.refresh()
    }, 900)
  }

  return (
    <main className="flex min-h-dvh items-end justify-center bg-zinc-100 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:items-center dark:bg-zinc-950">
      <section className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900">
        {pageState === 'checking' && (
          <div className="flex min-h-72 flex-col items-center justify-center text-center">
            <LoaderCircle className="mb-4 size-8 animate-spin text-zinc-400" />
            <h1 className="text-xl font-black">Đang kiểm tra lời mời</h1>
            <p className="mt-2 text-sm text-zinc-500">Chỉ mất một chút thôi.</p>
          </div>
        )}

        {pageState === 'invalid' && (
          <div className="flex min-h-72 flex-col items-center justify-center text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
              <ShieldAlert className="size-7" />
            </span>
            <h1 className="text-xl font-black">Không thể nhận lời mời</h1>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">{error}</p>
            <Button type="button" variant="outline" className="mt-6 h-11 rounded-xl px-5" onClick={() => router.replace('/login')}>
              Về trang đăng nhập
            </Button>
          </div>
        )}

        {(pageState === 'ready' || pageState === 'saving') && (
          <>
            <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <KeyRound className="size-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight">Tạo mật khẩu</h1>
            <p className="mt-2 text-sm text-zinc-500">Thiết lập mật khẩu để hoàn tất tài khoản nhân sự OmniHost.</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    className="h-12 pr-12 text-base"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(current => !current)}
                    className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-xl text-zinc-500"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500">Ít nhất 8 ký tự, gồm cả chữ và số.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Nhập lại mật khẩu</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmation}
                  onChange={event => setConfirmation(event.target.value)}
                  className="h-12 text-base"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              {error && <div role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</div>}

              <Button className="h-12 w-full rounded-xl text-base" disabled={pageState === 'saving'}>
                {pageState === 'saving' ? <><LoaderCircle className="animate-spin" /> Đang lưu…</> : 'Hoàn tất tài khoản'}
              </Button>
            </form>
          </>
        )}

        {pageState === 'success' && (
          <div className="flex min-h-72 flex-col items-center justify-center text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="size-7" />
            </span>
            <h1 className="text-xl font-black">Tài khoản đã sẵn sàng</h1>
            <p className="mt-2 text-sm text-zinc-500">Đang đưa bạn vào OmniHost…</p>
          </div>
        )}
      </section>
    </main>
  )
}
