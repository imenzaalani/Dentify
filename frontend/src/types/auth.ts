export type UserRole = "patient" | "receptionist" | "dentist" | "owner"

export interface User {
  id: string
  email: string
  phone?: string | null
  first_name?: string | null
  last_name?: string | null
  role: UserRole
  is_active: boolean
  is_verified: boolean
  avatar_url?: string | null
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface WorkingHourEntry {
  day: string
  start?: string | null
  end?: string | null
  off: boolean
}

export interface DentistProfile {
  specialty: string
  license_number: string
  bio?: string | null
  color: string
  working_hours: WorkingHourEntry[]
}

export interface StaffMember extends User {
  dentist_profile?: DentistProfile | null
  created_at?: string | null
}

export interface StaffCreatePayload {
  email: string
  phone?: string | null
  first_name: string
  last_name: string
  role: UserRole
  specialty?: string | null
  license_number?: string | null
  bio?: string | null
  color?: string | null
  working_hours?: WorkingHourEntry[] | null
}

export interface StaffUpdatePayload {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  specialty?: string | null
  license_number?: string | null
  bio?: string | null
  color?: string | null
  working_hours?: WorkingHourEntry[] | null
}