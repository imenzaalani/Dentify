export type GroupBy = "day" | "week" | "month"

export interface KpiValue {
  value: number
  change_pct: number | null
}

export interface Kpis {
  patients_seen: KpiValue
  new_patients: KpiValue
  revenue: KpiValue
  occupancy_rate: KpiValue
}

export interface RevenuePoint {
  label: string
  revenue: number
}

export interface CareBreakdownEntry {
  type: string
  count: number
  revenue: number
}

export interface TopAct {
  type: string
  count: number
  revenue: number
}

export interface PortfolioPoint {
  label: string
  existing: number
  new: number
  total: number
}

export interface OccupancyEntry {
  weekday: string
  occupancy_pct: number
  avg_appointments: number
}

export interface CancellationWeeklyPoint {
  label: string
  rate: number
}

export interface CancellationStats {
  cancelled_rate: number
  no_show_rate: number
  cancelled_rate_change_pct: number | null
  no_show_rate_change_pct: number | null
  weekly: CancellationWeeklyPoint[]
}

export interface StatsFull {
  group_by: GroupBy
  kpis: Kpis
  revenue_series: RevenuePoint[]
  care_breakdown: CareBreakdownEntry[]
  patient_growth: PortfolioPoint[]
  top_acts: TopAct[]
}

export interface StatsOperational {
  occupancy: OccupancyEntry[]
  cancellations: CancellationStats
}

export interface UnpaidInvoice {
  id: string
  number: string
  patient_id: string
  patient_name: string
  balance: number
  due_date: string
  days_overdue: number
}