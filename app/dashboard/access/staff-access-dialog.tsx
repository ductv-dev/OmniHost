'use client'

import { useState } from 'react'
import { Building2, Check, KeyRound, Trash2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { deleteStaffAccount, removeAssignment, saveAssignment } from './actions'
import { STAFF_ROLES, type AccessBuilding, type AccessUser, type StaffAssignment, type StaffRole } from './access-types'

function BuildingPermission({ user, building, assignment, onChanged }: {
  user: AccessUser
  building: AccessBuilding
  assignment?: StaffAssignment
  onChanged: (message: string, error?: boolean) => void
}) {
  const [role, setRole] = useState<StaffRole>((assignment?.role as StaffRole) ?? 'staff')
  const [pending, setPending] = useState(false)

  async function grantOrSave() {
    setPending(true)
    const result = await saveAssignment({ userId: user.id, buildingId: building.id, role })
    setPending(false)
    onChanged('error' in result ? result.error : assignment ? 'Đã cập nhật vai trò' : `Đã cấp quyền ${building.name}`, 'error' in result)
  }

  async function remove() {
    if (!assignment) return
    if (!window.confirm(`Gỡ quyền của ${user.full_name} khỏi ${building.name}?`)) return
    setPending(true)
    const result = await removeAssignment({ assignmentId: assignment.id })
    setPending(false)
    onChanged('error' in result ? result.error : `Đã gỡ quyền ${building.name}`, 'error' in result)
  }

  return (
    <div className={`rounded-2xl border p-4 ${assignment ? 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40'}`}>
      <div className="flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${assignment ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800'}`}><Building2 className="size-4" /></span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{building.name}</p><p className="truncate text-xs text-zinc-500">{building.address}</p></div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${assignment ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800'}`}>{assignment ? 'Đã cấp' : 'Chưa cấp'}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <select value={role} onChange={event => setRole(event.target.value as StaffRole)} disabled={pending} className="h-12 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-base dark:border-zinc-700 dark:bg-zinc-950">
          {STAFF_ROLES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <Button type="button" className="h-12 rounded-xl px-4" onClick={grantOrSave} disabled={pending || (assignment?.role === role)}>
          {assignment ? <><Check /> Lưu</> : 'Cấp quyền'}
        </Button>
        {assignment && <Button type="button" size="icon" variant="destructive" className="size-12 rounded-xl" onClick={remove} disabled={pending} aria-label={`Gỡ quyền ${building.name}`}><Trash2 /></Button>}
      </div>
    </div>
  )
}

export default function StaffAccessDialog({ open, onOpenChange, user, buildings, onChanged }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AccessUser | null
  buildings: AccessBuilding[]
  onChanged: (message: string, error?: boolean) => void
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

  if (!user) return null

  async function deleteAccount() {
    setDeletePending(true)
    const result = await deleteStaffAccount({ userId: user!.id })
    setDeletePending(false)
    if ('error' in result) return onChanged(result.error, true)
    setDeleteOpen(false)
    onOpenChange(false)
    onChanged('Đã xóa tài khoản nhân viên')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-white p-0 dark:bg-zinc-950 sm:h-auto sm:max-h-[92vh] sm:max-w-xl sm:rounded-3xl sm:border" showCloseButton>
        <DialogHeader className="shrink-0 border-b border-zinc-200 px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] text-left dark:border-zinc-800">
          <div className="flex items-center gap-3 pr-8">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900"><UserRound className="size-5" /></span>
            <div className="min-w-0"><DialogTitle className="truncate">{user.full_name}</DialogTitle><DialogDescription className="truncate">{user.email}</DialogDescription></div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {user.is_super_admin ? (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><KeyRound className="size-5" /> Super admin có toàn quyền trên mọi tòa nhà.</div>
          ) : (
            <>
              <div className="mb-4 flex items-end justify-between"><div><h3 className="font-bold">Quyền theo tòa nhà</h3><p className="text-xs text-zinc-500">Cấp vai trò riêng cho từng tòa.</p></div><span className="text-xs font-bold text-zinc-400">{user.assignments.length}/{buildings.length} tòa</span></div>
              <div className="space-y-3">
                {buildings.map(building => {
                  const assignment = user.assignments.find(item => item.building_id === building.id)
                  return <BuildingPermission key={`${building.id}:${assignment?.role ?? 'none'}`} user={user} building={building} assignment={assignment} onChanged={onChanged} />
                })}
              </div>
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
                <h3 className="text-sm font-bold text-red-700 dark:text-red-300">Xóa tài khoản</h3>
                <p className="mt-1 text-xs leading-5 text-red-600/80 dark:text-red-300/70">Nhân viên sẽ không thể đăng nhập. Booking, thanh toán và lịch sử vận hành vẫn được giữ lại.</p>
                <Button type="button" variant="destructive" className="mt-3 h-11 rounded-xl" onClick={() => setDeleteOpen(true)}><Trash2 /> Xóa nhân viên</Button>
              </div>
            </>
          )}
        </div>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="p-5" showCloseButton>
            <DialogHeader className="pr-8 text-left">
              <DialogTitle>Xóa tài khoản {user.full_name}?</DialogTitle>
              <DialogDescription>Thao tác này xóa quyền đăng nhập và toàn bộ phân công tòa nhà. Dữ liệu booking và thanh toán đã tạo trước đây không bị xóa.</DialogDescription>
            </DialogHeader>
            <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">Không thể hoàn tác thao tác này.</div>
            <DialogFooter className="grid grid-cols-2 sm:flex">
              <DialogClose asChild><Button type="button" variant="outline" className="h-11 rounded-xl" disabled={deletePending}>Hủy</Button></DialogClose>
              <Button type="button" variant="destructive" className="h-11 rounded-xl" onClick={deleteAccount} disabled={deletePending}>{deletePending ? 'Đang xóa…' : 'Xóa tài khoản'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
