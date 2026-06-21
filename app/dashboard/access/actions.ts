'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const roleSchema = z.enum(['manager', 'staff', 'booking_agent'])

const buildingRoleSchema = z.object({
  buildingId: z.string().uuid(),
  role: roleSchema,
})

const assignmentSchema = buildingRoleSchema.extend({
  userId: z.string().uuid(),
})

const inviteSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
  fullName: z.string().trim().min(2, 'Tên cần ít nhất 2 ký tự'),
  assignments: z.array(buildingRoleSchema).min(1, 'Chọn ít nhất một tòa nhà'),
}).refine(
  data => new Set(data.assignments.map(item => item.buildingId)).size === data.assignments.length,
  { message: 'Danh sách tòa nhà bị trùng', path: ['assignments'] }
)

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Bạn cần đăng nhập lại')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) throw new Error('Chỉ super admin được quản lý phân quyền')
  return user
}

function message(error: unknown) {
  return error instanceof Error ? error.message : 'Có lỗi xảy ra, vui lòng thử lại'
}

function inviteErrorMessage(error: { message?: string; status?: number; code?: string }) {
  const detail = error.message?.trim()
  if (detail && detail !== '{}') return detail
  if (error.status === 429) return 'Đã gửi quá nhiều email. Vui lòng đợi một lúc rồi thử lại.'
  return 'Supabase không gửi được email mời. Kiểm tra Redirect URLs, Custom SMTP và Authentication Logs.'
}

async function getInviteRedirectUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const requestOrigin = (await headers()).get('origin')
  const siteUrl = configuredUrl || requestOrigin

  if (!siteUrl) throw new Error('Thiếu NEXT_PUBLIC_SITE_URL để tạo đường dẫn nhận lời mời')

  const url = new URL(siteUrl)
  if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error('Địa chỉ ứng dụng phải sử dụng HTTPS')
  }
  url.pathname = '/auth/accept-invite'
  url.search = ''
  url.hash = ''
  return url.toString()
}

export async function inviteStaff(input: unknown): Promise<{ success: true } | { error: string }> {
  try {
    await requireSuperAdmin()
    const parsed = inviteSchema.safeParse(input)
    if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Dữ liệu không hợp lệ' }

    const admin = createAdminClient()
    const { email, fullName, assignments } = parsed.data
    const buildingIds = assignments.map(item => item.buildingId)
    const { data: buildings, error: buildingsError } = await admin
      .from('buildings')
      .select('id')
      .in('id', buildingIds)
    if (buildingsError || buildings?.length !== buildingIds.length) {
      return { error: 'Có tòa nhà không tồn tại hoặc đã bị xóa' }
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: await getInviteRedirectUrl(),
    })
    if (error) {
      console.error('[inviteStaff] Supabase Auth rejected invite', {
        name: error.name,
        status: error.status,
        code: error.code,
        message: error.message,
      })
      return { error: inviteErrorMessage(error) }
    }
    if (!data.user) return { error: 'Không tạo được tài khoản mời' }

    const { error: profileError } = await admin
      .from('profiles')
      .upsert({ id: data.user.id, full_name: fullName, is_super_admin: false })
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id)
      return { error: profileError.message }
    }

    const { error: assignmentError } = await admin
      .from('staff_assignments')
      .insert(assignments.map(item => ({
        user_id: data.user.id,
        building_id: item.buildingId,
        role: item.role,
      })))
    if (assignmentError) {
      await admin.auth.admin.deleteUser(data.user.id)
      return { error: assignmentError.message }
    }

    revalidatePath('/dashboard/access')
    return { success: true }
  } catch (error) {
    return { error: message(error) }
  }
}

export async function saveAssignment(input: unknown): Promise<{ success: true } | { error: string }> {
  try {
    await requireSuperAdmin()
    const parsed = assignmentSchema.safeParse(input)
    if (!parsed.success) return { error: 'Thông tin phân quyền không hợp lệ' }

    const admin = createAdminClient()
    const { userId, buildingId, role } = parsed.data
    const { data: target } = await admin.from('profiles').select('is_super_admin').eq('id', userId).single()
    if (!target) return { error: 'Không tìm thấy nhân sự' }
    if (target.is_super_admin) return { error: 'Super admin không cần gán quyền theo tòa' }

    const { error } = await admin
      .from('staff_assignments')
      .upsert(
        { user_id: userId, building_id: buildingId, role },
        { onConflict: 'user_id,building_id' }
      )
    if (error) return { error: error.message }

    revalidatePath('/dashboard/access')
    return { success: true }
  } catch (error) {
    return { error: message(error) }
  }
}

export async function removeAssignment(input: unknown): Promise<{ success: true } | { error: string }> {
  try {
    await requireSuperAdmin()
    const parsed = z.object({ assignmentId: z.string().uuid() }).safeParse(input)
    if (!parsed.success) return { error: 'Phân quyền không hợp lệ' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('staff_assignments')
      .delete()
      .eq('id', parsed.data.assignmentId)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/access')
    return { success: true }
  } catch (error) {
    return { error: message(error) }
  }
}

export async function deleteStaffAccount(input: unknown): Promise<{ success: true } | { error: string }> {
  try {
    const currentUser = await requireSuperAdmin()
    const parsed = z.object({ userId: z.string().uuid() }).safeParse(input)
    if (!parsed.success) return { error: 'Tài khoản không hợp lệ' }
    if (parsed.data.userId === currentUser.id) return { error: 'Bạn không thể tự xóa tài khoản của mình' }

    const admin = createAdminClient()
    const { data: target, error: targetError } = await admin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', parsed.data.userId)
      .single()
    if (targetError || !target) return { error: 'Không tìm thấy tài khoản nhân viên' }
    if (target.is_super_admin) return { error: 'Không thể xóa tài khoản super admin' }

    const { error } = await admin.auth.admin.deleteUser(parsed.data.userId)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/access')
    return { success: true }
  } catch (error) {
    return { error: message(error) }
  }
}
