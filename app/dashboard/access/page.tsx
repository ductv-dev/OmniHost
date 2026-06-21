import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import AccessManager from './access-manager'

export default async function AccessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()
  if (!currentProfile?.is_super_admin) redirect('/dashboard')

  const admin = createAdminClient()
  const [{ data: authData, error: authError }, profilesResult, buildingsResult, assignmentsResult] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from('profiles').select('id, full_name, phone, is_super_admin, created_at').order('created_at'),
      admin.from('buildings').select('id, name, address').order('name'),
      admin.from('staff_assignments').select('id, user_id, building_id, role, created_at').order('created_at'),
    ])

  if (authError) throw new Error(authError.message)
  if (profilesResult.error) throw new Error(profilesResult.error.message)
  if (buildingsResult.error) throw new Error(buildingsResult.error.message)
  if (assignmentsResult.error) throw new Error(assignmentsResult.error.message)

  const authById = new Map(authData.users.map(item => [item.id, item]))
  const users = (profilesResult.data ?? []).map(profile => {
    const authUser = authById.get(profile.id)
    return {
      ...profile,
      email: authUser?.email ?? 'Không có email',
      invited: Boolean(authUser?.invited_at && !authUser?.last_sign_in_at),
      assignments: (assignmentsResult.data ?? []).filter(item => item.user_id === profile.id),
    }
  })

  return (
    <AccessManager
      currentUserId={user.id}
      users={users}
      buildings={buildingsResult.data ?? []}
    />
  )
}
