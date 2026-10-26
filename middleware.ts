import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim())

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const creatorMode = request.nextUrl.searchParams.get('creator_mode')
  const embeddedMode = request.nextUrl.searchParams.get('embedded')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (creatorMode === '1') {
    response.cookies.set('soon_creator_mode', '1', { path: '/', sameSite: 'lax' })
  }

  if (embeddedMode === 'true') {
    return response
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth')
  if (isAuthCallback) return response
  if (!user) {
    if (!isLoginPage) return NextResponse.redirect(new URL('/login', request.url))
    return response
  }
  if (!ALLOWED_EMAILS.includes(user.email || '')) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
  }
  if (isLoginPage) return NextResponse.redirect(new URL('/', request.url))
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
