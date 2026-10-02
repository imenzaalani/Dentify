"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"

/**
 * Wrap any page/layout that should only be visible to a signed-in patient.
 * Auth now lives in httpOnly cookies (see app/api/auth/* and
 * app/api/backend/[...path]), so this could move to middleware.ts for real
 * server-side route protection. Kept as a client-side check for now since
 * middleware can't call the backend's /auth/me — it would need to decode
 * the JWT itself. See the note at the bottom of this file.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const wrongRole = !loading && !!user && user.role !== "patient"

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/sign-in")
      return
    }
    if (wrongRole) {
      // A staff session made it here (e.g. stale token, bookmarked link).
      // Don't render patient-scoped data for a non-patient user. Fire and
      // forget — the redirect below doesn't need to wait on the revoke call.
      void logout()
      router.replace("/sign-in")
    }
  }, [loading, user, wrongRole, router, logout])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Loading your account…
      </div>
    )
  }

  if (wrongRole) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Redirecting…
      </div>
    )
  }

  if (!user) return null // redirect effect above is already firing

  return <>{children}</>
}

// --- Note on middleware -----------------------------------------------
// Auth cookies are httpOnly now, so middleware.ts *can* read them — but a
// JWT still needs to be decoded/validated to know the role, and jose/JWT
// verification in edge middleware means either duplicating the backend's
// secret there or accepting an edge-compatible JWT library. The simpler
// version — checking only "is there a token" — is cheap in middleware and
// removes the one-frame flash before this component's redirect fires; full
// role-aware protection is still easiest left to this component (which can
// call /auth/me) unless that's worth the added complexity.