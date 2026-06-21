export type StaffRole = 'manager' | 'staff' | 'booking_agent'

export interface AccessBuilding {
  id: string
  name: string
  address: string
}

export interface StaffAssignment {
  id: string
  user_id: string
  building_id: string
  role: string
  created_at: string
}

export interface AccessUser {
  id: string
  full_name: string
  phone: string | null
  is_super_admin: boolean
  created_at: string
  email: string
  invited: boolean
  assignments: StaffAssignment[]
}

export const STAFF_ROLES: { value: StaffRole; label: string; description: string }[] = [
  { value: 'manager', label: 'Quản lý', description: 'Toàn quyền vận hành tòa nhà' },
  { value: 'staff', label: 'Nhân viên', description: 'Booking, khách và vận hành phòng' },
  { value: 'booking_agent', label: 'Đặt phòng', description: 'Xem và xử lý booking' },
]

export function roleLabel(role: string) {
  return STAFF_ROLES.find(item => item.value === role)?.label ?? role
}
