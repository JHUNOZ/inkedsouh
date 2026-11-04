import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function proxy(request) {
  const { pathname } = request.nextUrl

  // Fast-path: skip Supabase network round-trips on public pages and API routes
  const isProtectedOrAuthRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/estudiante') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/registro')

  if (!isProtectedOrAuthRoute) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  let userRole = null
  if (user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = roleData?.role || 'estudiante'
  }

  // Rutas protegidas de ADMIN
  if (pathname.startsWith('/admin')) {
    if (!user || userRole !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Rutas protegidas de ESTUDIANTE
  if (pathname.startsWith('/estudiante')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Si el usuario autenticado intenta entrar al login o registro, redirigirlo a su portal
  if (pathname.startsWith('/login') || pathname.startsWith('/registro')) {
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = userRole === 'admin' ? '/admin/resumen' : '/estudiante'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/estudiante/:path*',
    '/login',
    '/registro',
  ],
}
