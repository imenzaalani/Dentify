// Central place for staff role types and the auth/role lookup.
// `useCurrentRole` and `useAuthGuard` are the only two things that changed
// when real auth was wired up — everything else (sidebar, layouts,
// page-level conditional rendering) consumes them and needed no changes.

import { useAuth } from "@/lib/auth"

export type StaffRole = "receptionist" | "dentist" | "owner"

/**
 * Returns the current staff member's role, sourced from the real session.
 * Returns null if there's no signed-in user yet (loading or logged out) —
 * callers that need a role to render should check `useAuthGuard` instead,
 * which handles that state explicitly.
 */
export function useCurrentRole(): StaffRole | null {
  const { user } = useAuth()
  if (!user) return null
  return user.role as StaffRole
}

export interface AuthGuardResult {
  isLoading: boolean
  isAuthenticated: boolean
  isAuthorized: boolean
  role: StaffRole | null
}

/**
 * Single point of integration for route protection.
 *
 * - `isAuthenticated` reflects whether a real session exists.
 * - `isAuthorized` is `true` when no `roles` filter is given, or when the
 *   current role is included in it. Always `false` if not authenticated.
 *
 * Usage:
 *   const { isAuthenticated, isAuthorized, isLoading } = useAuthGuard({ roles: ["owner"] })
 */
export function useAuthGuard(options?: { roles?: StaffRole[] }): AuthGuardResult {
  const { user, loading } = useAuth()
  const role = user ? (user.role as StaffRole) : null

  const isLoading = loading
  const isAuthenticated = !!user
  const isAuthorized = isAuthenticated && (!options?.roles || options.roles.includes(role as StaffRole))

  return { isLoading, isAuthenticated, isAuthorized, role }
}