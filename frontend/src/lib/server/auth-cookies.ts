import "server-only"
import { cookies } from "next/headers"
import type { NextResponse } from "next/server"

export const ACCESS_COOKIE = "dentify_access_token"
export const REFRESH_COOKIE = "dentify_refresh_token"
// Not httpOnly, not sensitive — just a "was remember-me checked?" flag so a
// silent mid-session refresh (triggered by the access token expiring, e.g.
// after 30 minutes of activity) knows whether to keep re-issuing the
// refresh cookie as persistent or session-only. Incoming request cookies
// don't carry their own Max-Age, so without this the proxy would have no
// way to tell the two cases apart on refresh.
export const REMEMBER_COOKIE = "dentify_remember_me"

// Mirrors the backend's ACCESS_TOKEN_EXPIRE_MINUTES / REFRESH_TOKEN_EXPIRE_DAYS
// settings (app/core/config.py). Keep these in sync if those change — a
// cookie that outlives its token is harmless (the backend still rejects the
// expired token), but a cookie that expires before the token does forces an
// unnecessary re-login.
const ACCESS_TOKEN_MAX_AGE_SECONDS = 30 * 60
const REFRESH_TOKEN_MAX_AGE_SECONDS = 14 * 24 * 60 * 60

function cookieOptions(maxAge?: number, httpOnly = true) {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  }
}

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string, remember: boolean) {
  // Access token cookie is always capped at its own short lifetime — no
  // reason to ever make it a long-lived cookie.
  res.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS))
  // Refresh token cookie: persistent (survives browser restarts) only when
  // "remember me" was checked. Otherwise it's a session cookie — no maxAge
  // means the browser drops it when it closes, even though the underlying
  // JWT itself is still valid for REFRESH_TOKEN_EXPIRE_DAYS server-side.
  res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions(remember ? REFRESH_TOKEN_MAX_AGE_SECONDS : undefined))

  if (remember) {
    res.cookies.set(REMEMBER_COOKIE, "1", cookieOptions(REFRESH_TOKEN_MAX_AGE_SECONDS, false))
  } else {
    res.cookies.set(REMEMBER_COOKIE, "", cookieOptions(0, false))
  }
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { ...cookieOptions(0) })
  res.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions(0) })
  res.cookies.set(REMEMBER_COOKIE, "", { ...cookieOptions(0, false) })
}

// `cookies()` is async as of Next 15 and sync in Next 14 — `await` on a
// non-promise value resolves immediately, so this line works on either.
export async function readAuthCookies(): Promise<{
  accessToken: string | null
  refreshToken: string | null
  remember: boolean
}> {
  const store = await cookies()
  return {
    accessToken: store.get(ACCESS_COOKIE)?.value ?? null,
    refreshToken: store.get(REFRESH_COOKIE)?.value ?? null,
    remember: store.get(REMEMBER_COOKIE)?.value === "1",
  }
}