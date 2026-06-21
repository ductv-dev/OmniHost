'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Check, KeyRound, MailPlus, Search, ShieldCheck, Trash2, UserRound, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { inviteStaff, removeAssignment, saveAssignment } from './actions'

type StaffRole = 'manager' | 'staff' | 'booking_agent'

interface Building {
  id: string
  name: string
  address: string
}

interface Assignment {
  id: string
  user_id: string
  building_id: string
  role: string
  created_at: string
}

interface AccessUser {
  id: string
  full_name: string
  phone: string | null
  is_super_admin: boolean
  created_at: string
  email: string
  invited: boolean
  assignments: Assignment[]
}

const ROLES: { value: StaffRole; label: string; description: string }[] = [
  { value: 'manager', label: 'Quản lý', description: 'Toàn quyền vận hành tòa nhà' },
  { value: 'staff', label: 'Nhân viên', description: 'Booking, khách và vận hành phòng' },
  { value: 'booking_agent', label: 'Đặt phòng', description: 'Xem và xử lý booking' },
]

function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base outline-none focus:border-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-white"
    />
  )
}

function AssignmentRow({ assignment, building, onChanged }: {
  assignment: Assignment
  building?: Building
  onChanged: (message: string, error?: boolean) => void
}) {
  const [role, setRole] = useState<StaffRole>(assignment.role as StaffRole)
  const [pending, setPending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function save() {
    setPending(true)
    const result = await saveAssignment({
      userId: assignment.user_id,
      buildingId: assignment.building_id,
      role,
    })
    setPending(false)
    onChanged('error' in result ? result.error : 'Đã cập nhật quyền', 'error' in result)
  }

  async function remove() {
    setPending(true)
    const result = await removeAssignment({ assignmentId: assignment.id })
    setPending(false)
    if (!('error' in result)) setConfirmOpen(false)
    onChanged('error' in result ? result.error : 'Đã gỡ quyền khỏi tòa nhà', 'error' in result)
  }

  return (
    <div className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
          <Building2 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{building?.name ?? 'Tòa nhà đã xóa'}</p>
          <p className="truncate text-xs text-zinc-500">{building?.address}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <SelectField value={role} onChange={event => setRole(event.target.value as StaffRole)} disabled={pending}>
          {ROLES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </SelectField>
        <Button type="button" size="icon" className="size-12 shrink-0 rounded-xl" onClick={save} disabled={pending || role === assignment.role} aria-label="Lưu quyền">
          <Check className="size-4" />
        </Button>
        <Button type="button" size="icon" variant="outline" className="size-12 shrink-0 rounded-xl text-red-600" onClick={() => setConfirmOpen(true)} disabled={pending} aria-label="Gỡ quyền">
          <Trash2 className="size-4" />
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="p-5" showCloseButton>
          <DialogHeader className="pr-8 text-left">
            <DialogTitle>Gỡ quyền truy cập?</DialogTitle>
            <DialogDescription>
              Nhân sự sẽ mất quyền truy cập {building?.name ?? 'tòa nhà này'} ngay lập tức. Dữ liệu đã tạo trước đó không bị xóa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 grid grid-cols-2 sm:flex">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-11 rounded-xl" disabled={pending}>Giữ lại</Button>
            </DialogClose>
            <Button type="button" variant="destructive" className="h-11 rounded-xl" onClick={remove} disabled={pending}>
              {pending ? 'Đang gỡ…' : 'Gỡ quyền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AccessManager({ currentUserId, users, buildings }: {
  currentUserId: string
  users: AccessUser[]
  buildings: Building[]
}) {
  const router = useRouter()
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null)
  const [invitePending, setInvitePending] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [inviteBuilding, setInviteBuilding] = useState(buildings[0]?.id ?? '')
  const [inviteRole, setInviteRole] = useState<StaffRole>('staff')
  const [search, setSearch] = useState('')
  const [newAssignments, setNewAssignments] = useState<Record<string, { buildingId: string; role: StaffRole }>>({})
  const staffCount = useMemo(() => users.filter(item => !item.is_super_admin).length, [users])
  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi')
    if (!keyword) return users
    return users.filter(item =>
      `${item.full_name} ${item.email}`.toLocaleLowerCase('vi').includes(keyword)
    )
  }, [search, users])

  function changed(text: string, error = false) {
    setNotice({ text, error })
    if (!error) router.refresh()
  }

  async function submitInvite(event: React.FormEvent) {
    event.preventDefault()
    setInvitePending(true)
    const result = await inviteStaff({ email, fullName, buildingId: inviteBuilding, role: inviteRole })
    setInvitePending(false)
    if ('error' in result) return changed(result.error, true)
    setEmail('')
    setFullName('')
    changed('Đã gửi lời mời và gán quyền')
  }

  async function addAssignment(userId: string) {
    const draft = newAssignments[userId] ?? { buildingId: buildings[0]?.id ?? '', role: 'staff' as StaffRole }
    const result = await saveAssignment({ userId, ...draft })
    changed('error' in result ? result.error : 'Đã thêm quyền truy cập', 'error' in result)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <div className="mb-2 flex items-center gap-2 text-emerald-600">
          <ShieldCheck className="size-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Super admin</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">Phân quyền nhân sự</h1>
        <p className="mt-1 text-sm text-zinc-500">Mời nhân sự và giới hạn quyền riêng theo từng tòa nhà.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
          <p className="text-2xl font-black">{staffCount}</p>
          <p className="text-xs font-semibold text-zinc-500">Nhân sự</p>
        </div>
        <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
          <p className="text-2xl font-black">{buildings.length}</p>
          <p className="text-xs font-semibold text-zinc-500">Tòa nhà</p>
        </div>
      </div>

      <details className="group rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <summary className="cursor-pointer list-none text-sm font-bold">
          Vai trò được phép làm gì?
          <span className="float-right text-zinc-400 transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="mt-3 space-y-2">
          {ROLES.map(item => (
            <div key={item.value} className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
              <p className="text-sm font-bold">{item.label}</p>
              <p className="text-xs text-zinc-500">{item.description}</p>
            </div>
          ))}
          <p className="px-1 pt-1 text-xs text-zinc-500">Super admin có toàn quyền trên mọi tòa và là người duy nhất truy cập màn hình này.</p>
        </div>
      </details>

      {notice && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${notice.error ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
          {notice.text}
        </div>
      )}

      <section className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"><MailPlus className="size-5" /></span>
          <div>
            <h2 className="font-bold">Mời nhân sự mới</h2>
            <p className="text-xs text-zinc-500">Hệ thống gửi email thiết lập tài khoản</p>
          </div>
        </div>

        {buildings.length === 0 ? (
          <div className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <p>Hãy tạo tòa nhà đầu tiên trước khi mời nhân sự.</p>
            <Button asChild className="mt-3 h-10 rounded-xl"><Link href="/dashboard/buildings/new">Tạo tòa nhà</Link></Button>
          </div>
        ) : (
          <form onSubmit={submitInvite} className="space-y-3">
            <div><Label htmlFor="staff-name">Họ tên</Label><Input id="staff-name" value={fullName} onChange={event => setFullName(event.target.value)} className="mt-1 h-12 text-base" autoComplete="name" required /></div>
            <div><Label htmlFor="staff-email">Email</Label><Input id="staff-email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 h-12 text-base" type="email" inputMode="email" autoComplete="email" required /></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label htmlFor="staff-building">Tòa nhà</Label><SelectField id="staff-building" value={inviteBuilding} onChange={event => setInviteBuilding(event.target.value)}>{buildings.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField></div>
              <div><Label htmlFor="staff-role">Vai trò</Label><SelectField id="staff-role" value={inviteRole} onChange={event => setInviteRole(event.target.value as StaffRole)}>{ROLES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</SelectField></div>
            </div>
            <p className="text-xs text-zinc-500">{ROLES.find(item => item.value === inviteRole)?.description}</p>
            <Button className="h-12 w-full rounded-xl" disabled={invitePending}>{invitePending ? 'Đang gửi lời mời…' : 'Gửi lời mời'}</Button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
          <h2 className="font-bold">Danh sách tài khoản</h2>
          <p className="text-xs text-zinc-500">Mỗi người có thể được gán nhiều tòa nhà.</p>
          </div>
          <span className="text-xs font-semibold text-zinc-400">{filteredUsers.length}/{users.length}</span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="h-12 rounded-xl pl-10 text-base"
            type="search"
            placeholder="Tìm theo tên hoặc email"
            aria-label="Tìm nhân sự"
          />
        </div>

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 px-5 py-10 text-center dark:border-zinc-700">
            <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900"><UsersRound className="size-5 text-zinc-400" /></span>
            <p className="font-bold">Không tìm thấy nhân sự</p>
            <p className="mt-1 text-sm text-zinc-500">Thử tìm bằng tên hoặc email khác.</p>
          </div>
        )}

        {filteredUsers.map(item => (
          <article key={item.id} className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900"><UserRound className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-bold">{item.full_name}</h3>
                  {item.is_super_admin && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Super admin</span>}
                  {item.invited && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-300">Chờ nhận lời</span>}
                  {item.id === currentUserId && <span className="text-[11px] font-semibold text-zinc-400">Bạn</span>}
                </div>
                <p className="truncate text-sm text-zinc-500">{item.email}</p>
              </div>
            </div>

            {item.is_super_admin ? (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><KeyRound className="size-4" /> Có toàn quyền trên mọi tòa nhà</div>
            ) : (
              <div className="mt-4 space-y-3">
                {item.assignments.length === 0 && <p className="rounded-2xl bg-zinc-100 p-3 text-sm text-zinc-500 dark:bg-zinc-900">Chưa có quyền truy cập tòa nhà.</p>}
                {item.assignments.map(assignment => (
                  <AssignmentRow key={assignment.id} assignment={assignment} building={buildings.find(building => building.id === assignment.building_id)} onChanged={changed} />
                ))}

                {buildings.length > item.assignments.length && (
                  <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Thêm tòa nhà</p>
                    <div className="space-y-2 sm:flex sm:space-y-0 sm:gap-2">
                      <SelectField
                        value={(newAssignments[item.id]?.buildingId) ?? buildings.find(building => !item.assignments.some(assignment => assignment.building_id === building.id))?.id ?? ''}
                        onChange={event => setNewAssignments(current => ({ ...current, [item.id]: { buildingId: event.target.value, role: current[item.id]?.role ?? 'staff' } }))}
                      >
                        {buildings.filter(building => !item.assignments.some(assignment => assignment.building_id === building.id)).map(building => <option key={building.id} value={building.id}>{building.name}</option>)}
                      </SelectField>
                      <SelectField value={newAssignments[item.id]?.role ?? 'staff'} onChange={event => setNewAssignments(current => ({ ...current, [item.id]: { buildingId: current[item.id]?.buildingId ?? buildings.find(building => !item.assignments.some(assignment => assignment.building_id === building.id))?.id ?? '', role: event.target.value as StaffRole } }))}>{ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}</SelectField>
                      <Button type="button" className="h-12 w-full rounded-xl sm:w-auto" onClick={() => addAssignment(item.id)}>Thêm</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
