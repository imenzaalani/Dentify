export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { clearAuthCookies, readAuthCookies, setAuthCookies } from "@/lib/server/auth-cookies"

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

async function tryRefresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  })

  if (!res.ok) return null
  return res.json()
}

export async function loginHandler(req: NextRequest): Promise<NextResponse> {
  let body: { email?: string; password?: string; portal?: string; rememberMe?: boolean }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ detail: "Invalid request body" }, { status: 400 })
  }

  const { rememberMe, ...credentials } = body

  const backendRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    cache: "no-store",
  })

  const data = await backendRes.json().catch(() => ({}))

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status })
  }

  const res = NextResponse.json({ ok: true })
  setAuthCookies(res, data.access_token, data.refresh_token, Boolean(rememberMe))
  return res
}

export async function logoutHandler(_req: NextRequest): Promise<NextResponse> {
  const { accessToken, refreshToken } = await readAuthCookies()

  if (accessToken && refreshToken) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      })
    } catch {
      // Best-effort revoke; cookies are cleared below regardless.
    }
  }

  const res = NextResponse.json({ ok: true })
  clearAuthCookies(res)
  return res
}

export async function proxyHandler(req: NextRequest, path: string[]): Promise<NextResponse> {
  const { accessToken, refreshToken, remember } = await readAuthCookies()
  const targetPath = "/" + path.join("/")
  const search = req.nextUrl.search
  const method = req.method

  const originalContentType = req.headers.get("content-type")
  const isFormData = (originalContentType ?? "").includes("multipart/form-data")

  let jsonBody: string | undefined = undefined
  let rawBody: ArrayBuffer | undefined = undefined
  if (!["GET", "HEAD"].includes(method)) {
    if (isFormData) {
      rawBody = await req.arrayBuffer()
    } else {
      const parsed = await req.json().catch(() => null)
      jsonBody = parsed !== null ? JSON.stringify(parsed) : undefined
    }
  }

  async function forward(token: string | null) {
    const body = isFormData ? (rawBody ? rawBody.slice(0) : undefined) : jsonBody
    const headers: Record<string, string> = {
      "Content-Type": originalContentType ?? (isFormData ? "" : "application/json"),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    return fetch(`${API_URL}${targetPath}${search}`, {
      method,
      headers,
      body,
      cache: "no-store",
    })
  }

  let backendRes = await forward(accessToken)
  let refreshedTokens: { access_token: string; refresh_token: string } | null = null

  if (backendRes.status === 401 && refreshToken) {
    refreshedTokens = await tryRefresh(refreshToken)
    if (refreshedTokens) {
      backendRes = await forward(refreshedTokens.access_token)
    }
  }

  const status = backendRes.status
  const contentType = backendRes.headers.get("content-type") ?? ""

  let res: NextResponse
  if (status === 204) {
    res = new NextResponse(null, { status: 204 })
  } else if (contentType.includes("application/json")) {
    const data = await backendRes.json().catch(() => null)
    res = NextResponse.json(data, { status })
  } else {
    const buf = await backendRes.arrayBuffer()
    res = new NextResponse(buf, { status, headers: { "content-type": contentType } })
  }

  if (refreshedTokens) {
    setAuthCookies(res, refreshedTokens.access_token, refreshedTokens.refresh_token, remember)
  } else if (status === 401 && refreshToken) {
    clearAuthCookies(res)
  }

  return res
}
