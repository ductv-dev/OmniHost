import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  const destination = new URL('/auth/accept-invite', request.url)

  if (!tokenHash || type !== 'invite') {
    destination.searchParams.set('error_description', 'Liên kết mời không hợp lệ hoặc thiếu thông tin xác nhận.')
    return NextResponse.redirect(destination)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'invite',
  })

  if (error) {
    destination.searchParams.set('error_description', error.message)
  }

  return NextResponse.redirect(destination)
}
