export type CareCategory =
  | "soins_courants"
  | "chirurgie"
  | "orthodontie"
  | "esthetique"
  | "urgence"

export interface CareType {
  id: string
  name: string
  category: CareCategory
  default_duration_minutes: number
  color: string
  active: boolean
  price: number
  reimbursable_amount?: number | null
  created_at: string
  updated_at: string
}

export interface CareTypeCreateRequest {
  name: string
  category: CareCategory
  default_duration_minutes: number
  color?: string
  price: number
  reimbursable_amount?: number | null
}

export interface CareTypeUpdateRequest {
  name?: string
  category?: CareCategory
  default_duration_minutes?: number
  color?: string
  active?: boolean
  price?: number
  reimbursable_amount?: number | null
}