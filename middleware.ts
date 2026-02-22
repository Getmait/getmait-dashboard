import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes
  if (pathname === '/login' || pathname === '/') {
    return supabaseResponse
  }

  // Protected tenant routes: /[tenant_slug]/...
  const tenantSlugMatch = pathname.match(/^\/([^/]+)\//)
  const tenantSlug = tenantSlugMatch?.[1]

  if (!tenantSlug || tenantSlug === 'api') {
    return supabaseResponse
  }

  // Not logged in → redirect to login
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify user belongs to this tenant
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id, tenants!inner(slug)')
    .eq('user_id', user.id)
    .eq('tenants.slug', tenantSlug)
    .single()

  if (!tenantUser) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
