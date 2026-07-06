"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuthGuard, type StaffRole } from "@/lib/rbac"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AuthGuardProps {
  children: React.ReactNode
  /**
   * Roles allowed to view this subtree. Omit to only require a valid
   * session (e.g. the patient portal, which doesn't use staff roles).
   */
  roles?: StaffRole[]
  /** Where to send an unauthenticated visitor. */
  signInHref?: string
  /**
   * Where to send an authenticated-but-unauthorized visitor (wrong role).
   * NOTE: there isn't a canonical /errors/forbidden route in the app yet —
   * point this at one once the page cleanup (dentapp-frontend-review.md §4)
   * lands. Redirecting to the dashboard is a safe placeholder meanwhile.
   */
  forbiddenHref?: string
}

/**
 * Wraps a layout/page subtree with a session + role check. Currently a
 * no-op most of the time (auth isn't wired up — see lib/rbac.ts) but gives
 * the app a single place to plug in real auth later instead of touching
 * every admin/patient page individually.
 */
export function AuthGuard({
  children,
  roles,
  signInHref = "/auth/sign-in",
  forbiddenHref = "/staff/dashboard",
}: AuthGuardProps) {
  const router = useRouter()
  const { isLoading, isAuthenticated, isAuthorized } = useAuthGuard({ roles })

  React.useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace(signInHref)
      return
    }
    if (!isAuthorized) {
      router.replace(forbiddenHref)
    }
  }, [isLoading, isAuthenticated, isAuthorized, router, signInHref, forbiddenHref])

  if (isLoading || !isAuthenticated || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return <>{children}</>
}
