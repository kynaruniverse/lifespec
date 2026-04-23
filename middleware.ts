import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

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
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options ?? {})
          })
        },
      },
    }
  )

  const path = req.nextUrl.pathname

  const isProtected =
    path.startsWith('/dashboard') ||
    path.startsWith('/review') ||
    path.startsWith('/tasks') ||
    path.startsWith('/council') ||
    path.startsWith('/onboarding') ||
    path.startsWith('/activity') ||
    path.startsWith('/settings') ||
    path.startsWith('/requests')

  if (!isProtected) return res

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to home page (which handles auth inline)
    const homeUrl = new URL('/', req.url)
    homeUrl.searchParams.set('next', path)
    return NextResponse.redirect(homeUrl)
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
    '/activity/:path*',
    '/settings/:path*',
    '/requests/:path*',
  ],
}
