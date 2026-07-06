import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function proxy(request: NextRequest) {
  // Add custom middleware logic here
  // For example: authentication, redirects, etc.
  
  // Example: Redirect /login to /auth/sign-in
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }
  
  // Example: Redirect /register to /auth/sign-up
  if (request.nextUrl.pathname === '/register') {
    return NextResponse.redirect(new URL('/auth/sign-up', request.url))
  }

  // TODO (auth backend): this is the natural place to enforce session/role
  // checks server-side, in addition to the client-side AuthGuard in
  // components/auth-guard.tsx. Structuring it now avoids rewriting this
  // file from scratch later. Roughly:
  //
  //   const session = await getSessionFromCookie(request)
  //
  //   if (request.nextUrl.pathname.startsWith('/admin')) {
  //     if (!session) {
  //       return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  //     }
  //     if (!isStaffRouteAllowedForRole(request.nextUrl.pathname, session.role)) {
  //       return NextResponse.redirect(new URL('/errors/forbidden', request.url))
  //     }
  //   }
  //
  //   if (request.nextUrl.pathname.startsWith('/patient')) {
  //     if (!session || session.kind !== 'patient') {
  //       return NextResponse.redirect(new URL('/sign-in', request.url))
  //     }
  //   }
  //
  // Not implemented yet — there's no session/cookie to check against until
  // the backend exists. AuthGuard (client-side) plays the same role for now.

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
