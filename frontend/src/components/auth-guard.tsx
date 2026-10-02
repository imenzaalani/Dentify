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
  /**
   * Where to send an unauthenticated visitor. Defaults to the staff
   * sign-in when `roles` is set (staff subtree), otherwise the patient
   * sign-in. Pass explicitly to override.
   */
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
 * Wraps a layout/page subtree with a session + role check, backed by the
 * real auth context (see lib/rbac.ts / lib/auth.tsx). Single place to
 * handle route protection instead of touching every admin/patient page.
 */
export function AuthGuard({
  children,
  roles,
  signInHref,
  forbiddenHref = "/staff/dashboard",
}: AuthGuardProps) {
  const router = useRouter()
  const { isLoading, isAuthenticated, isAuthorized } = useAuthGuard({ roles })

  const resolvedSignInHref = signInHref ?? (roles ? "/staff/sign-in" : "/auth/sign-in")

  React.useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace(resolvedSignInHref)
      return
    }
    if (!isAuthorized) {
      router.replace(forbiddenHref)
    }
  }, [isLoading, isAuthenticated, isAuthorized, router, resolvedSignInHref, forbiddenHref])

  if (isLoading || !isAuthenticated || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return <>{children}</>
}