import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-6 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6 text-center">
        <p className="text-8xl font-black tracking-tighter text-zinc-200 dark:text-zinc-800">
          404
        </p>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Không tìm thấy trang
          </h1>
          <p className="text-sm text-zinc-500">
            Trang này không tồn tại hoặc đã bị xóa.
          </p>
        </div>
        <Link
          href="/dashboard/calendar"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-950 px-6 text-sm font-semibold text-white transition-transform active:scale-95 dark:bg-white dark:text-zinc-950"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
