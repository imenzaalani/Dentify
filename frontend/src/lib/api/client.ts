// Every request goes through this app's own /api/backend/* proxy rather
// than straight to FastAPI. The proxy attaches the access token from an
// httpOnly cookie server-side, so no auth token ever reaches browser JS —
// see app/api/backend/[...path]/route.ts and app/api/auth/*.
const PROXY_BASE = "/api/backend"

// Avatars are served directly off the backend's static /avatars mount and
// aren't behind auth, so image URLs point straight at the real backend
// origin rather than through the proxy.
const BACKEND_ORIGIN =
  process.env.NODE_ENV === "development"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(/\/api\/v1\/?$/, "")
    : ""

// Turns a relative path returned by the API (e.g. "/avatars/xyz.jpg") into an
// absolute URL the browser can load directly in an <img> tag. Passing an
// already-absolute URL through is a no-op.
export function getAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//.test(path)) return path
  return `${BACKEND_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData

  const res = await fetch(`${PROXY_BASE}${path}`, {
    ...options,
    // Same-origin, so this just means "send the httpOnly auth cookies" —
    // no token handling needed here at all.
    credentials: "include",
    headers: {
      // Let the browser set Content-Type (incl. multipart boundary) itself
      // when the body is FormData — an explicit application/json here would
      // break file uploads.
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.detail ?? message
    } catch {
      // non-JSON body, keep statusText
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const apiRequest = request