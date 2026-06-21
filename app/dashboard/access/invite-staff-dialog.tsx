'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MailPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inviteStaff } from './actions'
import { STAFF_ROLES, type AccessBuilding, type StaffRole } from './access-types'

export default function InviteStaffDialog({ open, onOpenChange, buildings, onChanged }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  buildings: AccessBuilding[]
  onChanged: (message: string, error?: boolean) => void
}) {
  const [pending, setPending] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [assignments, setAssignments] = useState<Record<string, StaffRole>>(
    () => buildings[0] ? { [buildings[0].id]: 'staff' } : {}
  )

  function reset() {
    setEmail('')
    setFullName('')
    setAssignments(buildings[0] ? { [buildings[0].id]: 'staff' } : {})
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    const result = await inviteStaff({
      email,
      fullName,
      assignments: Object.entries(assignments).map(([buildingId, role]) => ({ buildingId, role })),
    })
    setPending(false)
    if ('error' in result) return onChanged(result.error, true)
    reset()
    onOpenChange(false)
    onChanged('Đã gửi lời mời và cấp quyền tòa nhà')
  }

  function toggle(buildingId: string, checked: boolean) {
    setAssignments(current => {
      if (checked) return { ...current, [buildingId]: current[buildingId] ?? 'staff' }
      const next = { ...current }
      delete next[buildingId]
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-0 bg-white p-0 dark:bg-zinc-950 sm:h-auto sm:max-h-[92vh] sm:max-w-xl sm:rounded-3xl sm:border" showCloseButton>
        <DialogHeader className="shrink-0 border-b border-zinc-200 px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] text-left dark:border-zinc-800">
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"><MailPlus className="size-5" /></div>
          <DialogTitle>Mời nhân viên mới</DialogTitle>
          <DialogDescription>Chọn tất cả tòa nhà nhân viên được phép truy cập.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {buildings.length === 0 ? (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <p>Cần tạo ít nhất một tòa nhà trước khi mời nhân viên.</p>
              <Button asChild className="mt-3 h-10 rounded-xl"><Link href="/dashboard/buildings/new">Tạo tòa nhà</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-4">
                <div><Label htmlFor="invite-name">Họ tên</Label><Input id="invite-name" value={fullName} onChange={event => setFullName(event.target.value)} className="mt-1 h-12 text-base" autoComplete="name" required /></div>
                <div><Label htmlFor="invite-email">Email</Label><Input id="invite-email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 h-12 text-base" type="email" inputMode="email" autoComplete="email" required /></div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label>Quyền theo tòa nhà</Label><span className="text-xs font-bold text-zinc-400">{Object.keys(assignments).length} tòa</span></div>
                {buildings.map(building => {
                  const role = assignments[building.id]
                  return (
                    <div key={building.id} className={`rounded-2xl border p-3 ${role ? 'border-zinc-950 bg-zinc-50 dark:border-white dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800'}`}>
                      <label className="flex cursor-pointer items-start gap-3">
                        <input type="checkbox" checked={Boolean(role)} onChange={event => toggle(building.id, event.target.checked)} className="mt-0.5 size-5 accent-zinc-950 dark:accent-white" />
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{building.name}</span><span className="block truncate text-xs text-zinc-500">{building.address}</span></span>
                      </label>
                      {role && (
                        <select value={role} onChange={event => setAssignments(current => ({ ...current, [building.id]: event.target.value as StaffRole }))} className="mt-3 h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base dark:border-zinc-700 dark:bg-zinc-950">
                          {STAFF_ROLES.map(item => <option key={item.value} value={item.value}>{item.label} — {item.description}</option>)}
                        </select>
                      )}
                    </div>
                  )
                })}
              </div>

              <Button className="h-12 w-full rounded-xl text-base" disabled={pending || Object.keys(assignments).length === 0}>
                {pending ? 'Đang gửi lời mời…' : `Mời nhân viên · ${Object.keys(assignments).length} tòa`}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
