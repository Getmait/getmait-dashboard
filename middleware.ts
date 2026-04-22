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
  const hostname = request.headers.get('host')?.split(':')[0] ?? ''

  // Custom domain detection (not *.getmait.dk, not localhost)
  let customDomainSlug: string | null = null
  if (hostname && !hostname.includes('getmait.dk') && !hostname.includes('localhost')) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('custom_domain', hostname)
      .single()
    if (tenant) {
      customDomainSlug = (tenant as { slug: string }).slug
    }
  }

  if (customDomainSlug) {
    // Path may already carry the slug prefix after an auth redirect
    const alreadyPrefixed =
      pathname.startsWith(`/${customDomainSlug}/`) ||
      pathname === `/${customDomainSlug}`
    const effectivePath = alreadyPrefixed
      ? pathname
      : `/${customDomainSlug}${pathname === '/' ? '' : pathname}`

    // Tenant login is public
    if (effectivePath === `/${customDomainSlug}/login`) {
      return supabaseResponse
    }

    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = `/${customDomainSlug}/login`
      return NextResponse.redirect(loginUrl)
    }

    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, tenants!inner(slug)')
      .eq('user_id', user.id)
      .eq('tenants.slug', customDomainSlug)
      .single()

    if (!tenantUser) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = `/${customDomainSlug}/login`
      return NextResponse.redirect(loginUrl)
    }

    // Rewrite to internal slug-based routing (browser URL unchanged)
    if (!alreadyPrefixed) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = effectivePath
      return NextResponse.rewrite(rewriteUrl)
    }

    return supabaseResponse
  }

  // Public routes
  if (pathname === '/login' || pathname === '/') {
    return supabaseResponse
  }

  // Protected tenant routes: /[tenant_slug]/...
  const tenantSlugMatch = pathname.match(/^\/([^/]+)(?:\/|$)/)
  const tenantSlug = tenantSlugMatch?.[1]

  if (!tenantSlug || tenantSlug === 'api') {
    return supabaseResponse
  }

  // Tenant login page is public
  if (pathname === `/${tenantSlug}/login`) {
    return supabaseResponse
  }

  // Not logged in → redirect to tenant login
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = `/${tenantSlug}/login`
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
    loginUrl.pathname = `/${tenantSlug}/login`
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
