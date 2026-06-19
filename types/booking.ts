// Manual types for booking management tables.
// Companion to the auto-generated types/supabase.ts.

export type BookingSource = 'airbnb' | 'booking' | 'agoda' | 'direct' | 'facebook' | 'tiktok'
export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
export type GuestType = 'short_stay' | 'long_stay'
export type GuestGender = 'male' | 'female' | 'other'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'momo' | 'other'
export type HousekeepingStatus = 'clean' | 'dirty' | 'cleaning' | 'ready'
export type StaffRole = 'super_admin' | 'manager' | 'staff' | 'booking_agent'

export interface Guest {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  gender: GuestGender | null
  country: string | null
  note: string | null
  created_at: string
}

export interface Booking {
  id: string
  building_id: string
  room_id: string
  guest_id: string | null
  source: BookingSource
  status: BookingStatus
  guest_type: GuestType
  check_in: string  // 'YYYY-MM-DD'
  check_out: string // 'YYYY-MM-DD'
  check_in_time: string
  check_out_time: string
  num_adults: number
  num_children: number
  total_price: number
  deposit_paid: number
  note: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface BookingWithDetails extends Booking {
  guest: Guest | null
  room: {
    id: string
    room_number: string
    default_price: number
  }
  building: {
    id: string
    name: string
  }
}

export interface BookingHistoryEntry {
  id: string
  booking_id: string
  action: 'created' | 'updated' | 'cancelled' | 'deleted'
  changes: Record<string, unknown> | null
  changed_by: string | null
  changed_at: string
}

// Used when fetching buildings + their rooms for the booking form
export interface RoomForBooking {
  id: string
  building_id: string
  room_number: string
  floor: number
  default_price: number
  is_active: boolean
}

export interface BuildingForBooking {
  id: string
  name: string
  rooms: RoomForBooking[]
}

// Display helpers
export const SOURCE_LABELS: Record<BookingSource, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  agoda: 'Agoda',
  direct: 'Khách lẻ',
  facebook: 'Facebook',
  tiktok: 'TikTok',
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: 'Đã đặt',
  checked_in: 'Đang ở',
  checked_out: 'Đã trả phòng',
  cancelled: 'Đã hủy',
  no_show: 'Không đến',
}

export const GUEST_TYPE_LABELS: Record<GuestType, string> = {
  short_stay: 'Ngắn ngày',
  long_stay: 'Dài ngày',
}
