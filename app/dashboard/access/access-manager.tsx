'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, MailPlus, Search, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import InviteStaffDialog from './invite-staff-dialog'
import StaffAccessDialog from './staff-access-dialog'
import { STAFF_ROLES, roleLabel, type AccessBuilding, type AccessUser } from './access-types'

export default function AccessManager({ currentUserId, users, buildings }: {
  currentUserId: string
  users: AccessUser[]
  buildings: AccessBuilding[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null)

  const selectedUser = users.find(user => user.id === selectedUserId) ?? null
  const staffCount = users.filter(user => !user.is_super_admin).length
  const assignedStaffCount = users.filter(user => !user.is_super_admin && user.assignments.length > 0).length
  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    if (!keyword) return users
    return users.filter(user => `${user.full_name} ${user.email}`.toLocaleLowerCase('vi').includes(keyword))
  }, [search, users])

  function changed(text: string, error = false) {
    setNotice({ text, error })
    if (!error) router.refresh()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-emerald-600"><ShieldCheck className="size-5" /><span className="text-xs font-bold uppercase tracking-widest">Super admin</span></div>
          <h1 className="text-2xl font-black tracking-tight">Nhân viên</h1>
          <p className="mt-1 text-sm text-zinc-500">Quản lý tài khoản và quyền truy cập từng tòa.</p>
        </div>
        <Button type="button" className="h-11 shrink-0 rounded-xl px-4" onClick={() => setInviteOpen(true)} disabled={buildings.length === 0}>
          <MailPlus /> <span className="hidden sm:inline">Mời nhân viên</span><span className="sm:hidden">Thêm</span>
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Stat value={staffCount} label="Nhân viên" />
        <Stat value={assignedStaffCount} label="Đã cấp quyền" />
        <Stat value={buildings.length} label="Tòa nhà" />
      </div>

      {buildings.length === 0 && (
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <p className="font-bold">Chưa có tòa nhà</p>
          <p className="mt-1">Tạo tòa nhà trước khi cấp quyền cho nhân viên.</p>
          <Button asChild className="mt-3 h-10 rounded-xl"><Link href="/dashboard/buildings/new">Tạo tòa nhà</Link></Button>
        </div>
      )}

      <details className="group rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <summary className="cursor-pointer list-none text-sm font-bold">Ma trận vai trò<span className="float-right text-zinc-400 transition-transform group-open:rotate-45">+</span></summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {STAFF_ROLES.map(role => <div key={role.value} className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900"><p className="text-sm font-bold">{role.label}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{role.description}</p></div>)}
        </div>
      </details>

      {notice && <div role="status" className={`rounded-2xl px-4 py-3 text-sm font-semibold ${notice.error ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>{notice.text}</div>}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3"><div><h2 className="font-bold">Tài khoản hiện tại</h2><p className="text-xs text-zinc-500">Chạm vào nhân viên để chỉnh toàn bộ quyền.</p></div><span className="text-xs font-bold text-zinc-400">{filteredUsers.length}/{users.length}</span></div>
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-12 rounded-xl pl-10 text-base" type="search" placeholder="Tìm tên hoặc email" aria-label="Tìm nhân viên" /></div>

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 px-5 py-10 text-center dark:border-zinc-700"><span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900"><UsersRound className="size-5 text-zinc-400" /></span><p className="font-bold">Không tìm thấy nhân viên</p><p className="mt-1 text-sm text-zinc-500">Thử tên hoặc email khác.</p></div>
        )}

        <div className="space-y-2">
          {filteredUsers.map(user => (
            <button key={user.id} type="button" onClick={() => setSelectedUserId(user.id)} className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-left transition-colors active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:active:bg-zinc-900">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900"><UserRound className="size-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2"><span className="truncate text-sm font-bold">{user.full_name}</span>{user.id === currentUserId && <span className="text-[10px] font-bold text-zinc-400">BẠN</span>}</span>
                <span className="block truncate text-xs text-zinc-500">{user.email}</span>
                <span className="mt-2 flex flex-wrap gap-1">
                  {user.is_super_admin ? <Badge label="Super admin" tone="green" /> : user.assignments.length === 0 ? <Badge label="Chưa cấp tòa" tone="gray" /> : <><Badge label={`${user.assignments.length} tòa`} tone="green" />{[...new Set(user.assignments.map(item => roleLabel(item.role)))].map(label => <Badge key={label} label={label} tone="gray" />)}</>}
                  {user.invited && <Badge label="Chờ nhận lời" tone="amber" />}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-zinc-300" />
            </button>
          ))}
        </div>
      </section>

      <InviteStaffDialog open={inviteOpen} onOpenChange={setInviteOpen} buildings={buildings} onChanged={changed} />
      <StaffAccessDialog open={Boolean(selectedUser)} onOpenChange={open => { if (!open) setSelectedUserId(null) }} user={selectedUser} buildings={buildings} onChanged={changed} />
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return <div className="rounded-2xl bg-zinc-100 p-3 dark:bg-zinc-900"><p className="text-xl font-black">{value}</p><p className="mt-0.5 truncate text-[11px] font-semibold text-zinc-500">{label}</p></div>
}

function Badge({ label, tone }: { label: string; tone: 'green' | 'amber' | 'gray' }) {
  const colors = tone === 'green' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : tone === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900'
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${colors}`}>{label}</span>
}
