import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Only check session if route requires it
  const path = req.nextUrl.pathname

  const isAuthPage = path.startsWith('/login') || path.startsWith('/signup')
  const isProtected =
    path.startsWith('/dashboard') ||
    path.startsWith('/review') ||
    path.startsWith('/tasks') ||
    path.startsWith('/council') ||
    path.startsWith('/onboarding')

  let user = null

  if (isProtected || isAuthPage) {
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  // 🚫 Not logged in → block protected routes
  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 🚫 Logged in → block auth pages
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/review/:path*',
    '/tasks/:path*',
    '/council/:path*',
    '/onboarding/:path*',
    '/login',
    '/signup',
  ],
}