import type { Metadata } from 'next'
import AcceptInviteForm from './accept-invite-form'

export const metadata: Metadata = {
  title: 'Thiết lập tài khoản',
  description: 'Tạo mật khẩu để bắt đầu sử dụng OmniHost.',
}

export default function AcceptInvitePage() {
  return <AcceptInviteForm />
}
