// Central place for staff role types and the (currently mocked) auth/role
// lookup. Once a real backend exists, `useCurrentRole` and `useAuthGuard`
// are the only two things that need to change — everything else (sidebar,
// layouts, page-level conditional rendering) consumes them.
//
// TODO: replace the mocked bits below with a real session/auth call
// (e.g. a React context populated from `/me`, or a server session lookup).

export type StaffRole = "receptionist" | "dentist" | "owner"

// TODO: replace with real session/auth role once auth is wired up.
// Toggle this manually for now to preview the different role states across
// the app (sidebar, patient dossier, route guards all read from here).
export const CURRENT_ROLE: StaffRole = "dentist"

/**
 * Returns the current staff member's role.
 * TODO: source from session/auth context instead of the hardcoded constant.
 */
export function useCurrentRole(): StaffRole {
  return CURRENT_ROLE
}

export interface AuthGuardResult {
  isLoading: boolean
  isAuthenticated: boolean
  isAuthorized: boolean
  role: StaffRole
}

/**
 * Single point of integration for route protection.
 *
 * - `isAuthenticated` always resolves to `true` for now (no backend to check
 *   a session against yet) — flip this once auth exists, nothing that calls
 *   this hook needs to change.
 * - `isAuthorized` is `true` when no `roles` filter is given, or when the
 *   current role is included in it.
 *
 * Usage:
 *   const { isAuthenticated, isAuthorized, isLoading } = useAuthGuard({ roles: ["owner"] })
 */
export function useAuthGuard(options?: { roles?: StaffRole[] }): AuthGuardResult {
  const role = useCurrentRole()

  // TODO: replace with a real session check (loading state while the
  // session request is in flight, false when there's no valid session).
  const isLoading = false
  const isAuthenticated = true

  const isAuthorized = !options?.roles || options.roles.includes(role)

  return { isLoading, isAuthenticated, isAuthorized, role }
}
