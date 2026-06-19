/** Loại template:
 * - 'building': Tự động điền thông tin từ DB (cần chọn Building + Room)
 * - 'custom': Toàn bộ điền tay, không cần chọn phòng
 */
export type TemplateType = 'building' | 'custom'

export interface MessageTemplate {
  id: string
  name: string
  category: string
  type: TemplateType
  content: string
}

export interface TemplateVariable {
  key: string
  label: string
  description: string
}

const PASSPORT_ONE_GUEST = `Please provide me with pictures of your passport and visa so we can register your temporary residence. Thank you 😊`

const PASSPORT_TWO_GUESTS = `Please provide me with a photo of your and your partner's passport and visa upon check-in so we can register you for temporary stay. Thank you 😊`

function createCheckInTemplateContent(intro: string, passportRequest: string): string {
  return `${intro}

This is my address: {{building_address}}
The name on the sign is {{building_sign_name}}.
Please search the link I sent to get to the exact address : {{building_map_link}}
Image of the key from the gate. Its password is: {{gate_password}}
Then you go to the {{floor_ordinal}} floor. Right next to the door there is a lock box containing the card for room {{room_number}}.
The lockbox password is: {{lockbox_password}}
Take a card and open the room
Name wifi your room: {{wifi_name}}
Password wifi: {{wifi_password}}
Name wifi the lobby if you need: {{lobby_wifi_name}}
Password wifi: {{lobby_wifi_password}}
{{drinking_water_note}}
There is a washing machine in the hallway on {{washing_machine_floor_ordinal}} floor and a dryer on the {{dryer_floor_ordinal}} floor. You can use it
{{room_note}}
{{motorbike_parking_note}}
${passportRequest}`
}

export const defaultTemplates: MessageTemplate[] = [
  {
    id: 'ask-check-in-time',
    name: 'Ask Check-in Time',
    category: 'Check-in',
    type: 'custom',
    content: `Hello! Please update me with your estimated check-in time. We will send you the information for a smooth check-in tomorrow. Thank you!`
  },
  {
    id: 'checkin-before-2pm-one-guest',
    name: 'Check-in Before 2PM - 1 Guest',
    category: 'Check-in',
    type: 'building',
    content: createCheckInTemplateContent(
      'Hello, this is the check in information for tomorrow. You can check in yourself around 2pm, if the room is ready earlier I will let you know. Otherwise you can leave your luggage in the lobby if you arrive early.',
      PASSPORT_ONE_GUEST
    )
  },
  {
    id: 'checkin-before-2pm-two-guests',
    name: 'Check-in Before 2PM - 2 Guests',
    category: 'Check-in',
    type: 'building',
    content: createCheckInTemplateContent(
      'Hello, this is the check in information for tomorrow. You can check in yourself around 2pm, if the room is ready earlier I will let you know. Otherwise you can leave your luggage in the lobby if you arrive early.',
      PASSPORT_TWO_GUESTS
    )
  },
  {
    id: 'checkin-after-2pm-one-guest',
    name: 'Check-in After 2PM - 1 Guest',
    category: 'Check-in',
    type: 'building',
    content: createCheckInTemplateContent(
      'Hello, this is the information for tomorrow so you can check in easily when you arrive.',
      PASSPORT_ONE_GUEST
    )
  },
  {
    id: 'checkin-after-2pm-two-guests',
    name: 'Check-in After 2PM - 2 Guests',
    category: 'Check-in',
    type: 'building',
    content: createCheckInTemplateContent(
      'Hello, this is the information for tomorrow so you can check in easily when you arrive.',
      PASSPORT_TWO_GUESTS
    )
  },
  {
    id: 'passport-one-guest',
    name: 'Passport - 1 Guest',
    category: 'Guest Docs',
    type: 'custom',
    content: PASSPORT_ONE_GUEST
  },
  {
    id: 'passport-two-guests',
    name: 'Passport - 2 Guests',
    category: 'Guest Docs',
    type: 'custom',
    content: PASSPORT_TWO_GUESTS
  }
]

/** Variables tự động điền từ DB (không cần nhập tay) */
export const DB_VARIABLES: TemplateVariable[] = [
  { key: 'building_name', label: 'Building Name', description: 'Tên tòa' },
  { key: 'building_sign_name', label: 'Sign Name', description: 'Tên trên biển hiệu' },
  { key: 'building_address', label: 'Building Address', description: 'Địa chỉ tòa' },
  { key: 'building_map_link', label: 'Map Link', description: 'Link Google Maps của tòa' },
  { key: 'room_number', label: 'Room Number', description: 'Mã hoặc số phòng' },
  { key: 'floor', label: 'Floor', description: 'Tầng của phòng' },
  { key: 'floor_ordinal', label: 'Floor Ordinal', description: 'Tầng dạng 1st, 2nd, 3rd' },
  { key: 'gate_password', label: 'Gate Password', description: 'Mã cửa/cổng tòa' },
  { key: 'lockbox_password', label: 'Lockbox Password', description: 'Mã hộp khóa/phòng' },
  { key: 'wifi_name', label: 'Wi-Fi Name', description: 'Tên Wi-Fi phòng' },
  { key: 'wifi_password', label: 'Wi-Fi Password', description: 'Mật khẩu Wi-Fi phòng' },
  { key: 'lobby_wifi_name', label: 'Lobby Wi-Fi', description: 'Tên Wi-Fi lobby' },
  { key: 'lobby_wifi_password', label: 'Lobby Wi-Fi Password', description: 'Mật khẩu Wi-Fi lobby' },
  { key: 'drinking_water_note', label: 'Drinking Water Note', description: 'Ghi chú nước uống' },
  { key: 'washing_machine_floor', label: 'Washing Machine Floor', description: 'Tầng có máy giặt' },
  { key: 'washing_machine_floor_ordinal', label: 'Washing Machine Floor Ordinal', description: 'Tầng máy giặt dạng 1st, 2nd' },
  { key: 'dryer_floor', label: 'Dryer Floor', description: 'Tầng có máy sấy' },
  { key: 'dryer_floor_ordinal', label: 'Dryer Floor Ordinal', description: 'Tầng máy sấy dạng 1st, 2nd' },
  { key: 'room_note', label: 'Room Note', description: 'Ghi chú riêng của phòng' },
  { key: 'motorbike_parking_note', label: 'Motorbike Parking Note', description: 'Ghi chú gửi xe máy' },
]

export const KNOWN_VARIABLES = DB_VARIABLES.map(variable => variable.key)

export const MANUAL_VARIABLE_SUGGESTIONS: TemplateVariable[] = [
  { key: 'ten-khach', label: 'Tên khách', description: 'Tên khách' },
  { key: 'so-dien-thoai', label: 'Số điện thoại', description: 'Số điện thoại khách' },
  { key: 'ngay-nhan-phong', label: 'Ngày nhận phòng', description: 'Ngày check-in' },
  { key: 'ngay-tra-phong', label: 'Ngày trả phòng', description: 'Ngày check-out' },
  { key: 'so-khach', label: 'Số khách', description: 'Số lượng người' },
  { key: 'gio-nhan-phong', label: 'Giờ nhận phòng', description: 'Giờ check-in dự kiến' },
  { key: 'gia-phong', label: 'Giá phòng', description: 'Giá mỗi đêm' },
  { key: 'tinh-trang-thanh-toan', label: 'Thanh toán', description: 'Tình trạng thanh toán' },
  { key: 'hotline', label: 'Hotline', description: 'Số hỗ trợ' },
]

function extractTemplateVariables(template: string): string[] {
  if (!template) return []

  const regex = /\{\{([^}]+)\}\}/g
  const matches = [...template.matchAll(regex)]
  const allKeys = matches.map(match => match[1].trim()).filter(Boolean)

  return Array.from(new Set(allKeys))
}

function normalizeTemplateType(value: unknown): TemplateType {
  return value === 'custom' ? 'custom' : 'building'
}

function normalizeTemplate(value: unknown): MessageTemplate | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const candidate = value as Record<string, unknown>
  const id = typeof candidate.id === 'string' ? candidate.id.trim() : ''
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : ''
  const category = typeof candidate.category === 'string' ? candidate.category.trim() : ''
  const content = typeof candidate.content === 'string' ? candidate.content : ''

  if (!id || !name || !category || !content.trim()) {
    return null
  }

  return {
    id,
    name,
    category,
    type: normalizeTemplateType(candidate.type),
    content,
  }
}

export function normalizeMessageTemplates(value: unknown): MessageTemplate[] {
  let parsed = value

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .map(template => normalizeTemplate(template))
    .filter((template): template is MessageTemplate => Boolean(template))
}

export function parseMessageTemplates(
  value: unknown,
  fallback: MessageTemplate[] = defaultTemplates
): MessageTemplate[] {
  const templates = normalizeMessageTemplates(value)
  return templates.length > 0 ? templates : fallback
}

/**
 * Trích xuất các biến động (cần nhập tay) từ nội dung template.
 * - Với loại 'building': bỏ qua KNOWN_VARIABLES (đã auto-fill từ DB)
 * - Với loại 'custom': TẤT CẢ biến đều cần nhập tay
 */
export function extractDynamicVariables(template: string, type: TemplateType = 'building'): string[] {
  const uniqueKeys = extractTemplateVariables(template)

  if (type === 'custom') {
    // Custom: tất cả biến đều điền tay
    return uniqueKeys
  }

  // Building: chỉ lấy các biến ngoài KNOWN_VARIABLES
  return uniqueKeys.filter(key => !KNOWN_VARIABLES.includes(key))
}

export function extractDatabaseVariables(template: string, type: TemplateType = 'building'): string[] {
  if (type === 'custom') return []
  return extractTemplateVariables(template).filter(key => KNOWN_VARIABLES.includes(key))
}

export function getTemplateSyntaxIssues(template: string): string[] {
  const issues: string[] = []
  const openCount = template.match(/\{\{/g)?.length ?? 0
  const closeCount = template.match(/\}\}/g)?.length ?? 0

  if (openCount !== closeCount) {
    issues.push('Có cặp {{ }} chưa đóng hoặc chưa mở đúng.')
  }

  const invalidVariables = extractTemplateVariables(template).filter(
    key => !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key)
  )

  if (invalidVariables.length > 0) {
    issues.push(`Tên biến nên dùng chữ, số, gạch dưới: ${invalidVariables.join(', ')}.`)
  }

  return issues
}

/**
 * Thay thế tất cả {{biến}} trong template bằng giá trị thực.
 */
export function generateTemplateMessage(
  template: string,
  dbVariables: Record<string, string>,
  dynamicVariables: Record<string, string>
): string {
  if (!template) return ''

  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim()

    if (dbVariables[trimmedKey] !== undefined) {
      return dbVariables[trimmedKey]
    }

    if (dynamicVariables[trimmedKey] !== undefined && dynamicVariables[trimmedKey] !== '') {
      return dynamicVariables[trimmedKey]
    }

    return match
  })
}

/** Chuyển kebab-case / snake_case thành Title Case để hiển thị label */
export function formatVariableLabel(key: string): string {
  return key
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
