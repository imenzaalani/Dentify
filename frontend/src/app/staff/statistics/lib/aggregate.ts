import statsData from "../data.json"

export interface ActEntry {
  type: string
  count: number
  revenue: number
}

export interface DayRecord {
  date: string
  slotsAvailable: number
  slotsUsed: number
  appointmentsTotal: number
  cancelled: number
  noShow: number
  patientsSeen: number
  newPatients: number
  revenue: number
  acts: ActEntry[]
}

export type PeriodPreset = "today" | "7d" | "30d" | "3m" | "year" | "custom"

export interface PeriodRange {
  start: Date
  end: Date
}

const allDays = (statsData as { days: DayRecord[] }).days
const portfolioBaseline = (statsData as { portfolioBaseline: number })
  .portfolioBaseline

// The mock dataset's most recent day acts as "today" for this demo.
export const ANCHOR_DATE = new Date(allDays[allDays.length - 1].date)

const toKey = (d: Date) => d.toISOString().split("T")[0]
const addDays = (d: Date, n: number) => {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

export function presetToRange(
  preset: PeriodPreset,
  custom?: PeriodRange
): PeriodRange {
  switch (preset) {
    case "today":
      return { start: ANCHOR_DATE, end: ANCHOR_DATE }
    case "7d":
      return { start: addDays(ANCHOR_DATE, -6), end: ANCHOR_DATE }
    case "30d":
      return { start: addDays(ANCHOR_DATE, -29), end: ANCHOR_DATE }
    case "3m":
      return { start: addDays(ANCHOR_DATE, -89), end: ANCHOR_DATE }
    case "year":
      return {
        start: new Date(ANCHOR_DATE.getFullYear(), 0, 1),
        end: ANCHOR_DATE,
      }
    case "custom":
      return custom ?? { start: addDays(ANCHOR_DATE, -29), end: ANCHOR_DATE }
  }
}

export function previousRange(range: PeriodRange): PeriodRange {
  const spanDays =
    Math.round(
      (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  const prevEnd = addDays(range.start, -1)
  const prevStart = addDays(prevEnd, -(spanDays - 1))
  return { start: prevStart, end: prevEnd }
}

const dayIndex = new Map(allDays.map((d) => [d.date, d]))

export function filterDays(range: PeriodRange): DayRecord[] {
  const startKey = toKey(range.start)
  const endKey = toKey(range.end)
  return allDays.filter((d) => d.date >= startKey && d.date <= endKey)
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

export interface Kpi {
  label: string
  value: number
  changePct: number | null
}

export function computeKpis(range: PeriodRange) {
  const current = filterDays(range)
  const previous = filterDays(previousRange(range))

  const sum = (days: DayRecord[], key: "patientsSeen" | "newPatients" | "revenue") =>
    days.reduce((acc, d) => acc + d[key], 0)

  const occupancy = (days: DayRecord[]) => {
    const available = days.reduce((a, d) => a + d.slotsAvailable, 0)
    const used = days.reduce((a, d) => a + d.slotsUsed, 0)
    return available === 0 ? 0 : (used / available) * 100
  }

  const patientsSeen = sum(current, "patientsSeen")
  const patientsSeenPrev = sum(previous, "patientsSeen")
  const newPatients = sum(current, "newPatients")
  const newPatientsPrev = sum(previous, "newPatients")
  const revenue = sum(current, "revenue")
  const revenuePrev = sum(previous, "revenue")
  const occupancyRate = occupancy(current)
  const occupancyRatePrev = occupancy(previous)

  return {
    patientsSeen: { value: patientsSeen, changePct: pctChange(patientsSeen, patientsSeenPrev) },
    newPatients: { value: newPatients, changePct: pctChange(newPatients, newPatientsPrev) },
    revenue: { value: revenue, changePct: pctChange(revenue, revenuePrev) },
    occupancyRate: {
      value: occupancyRate,
      changePct: pctChange(occupancyRate, occupancyRatePrev),
    },
  }
}

export type GroupBy = "day" | "week" | "month"

export function groupByForRange(range: PeriodRange): GroupBy {
  const spanDays =
    (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24) + 1
  if (spanDays <= 14) return "day"
  if (spanDays <= 120) return "week"
  return "month"
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function isoWeekKey(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

export interface RevenuePoint {
  label: string
  revenue: number
}

export function revenueSeries(range: PeriodRange): RevenuePoint[] {
  const days = filterDays(range)
  const groupBy = groupByForRange(range)

  if (groupBy === "day") {
    return days.map((d) => ({
      label: new Date(d.date).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
      }),
      revenue: Math.round(d.revenue),
    }))
  }

  if (groupBy === "week") {
    const buckets = new Map<string, number>()
    for (const d of days) {
      const key = isoWeekKey(new Date(d.date))
      buckets.set(key, (buckets.get(key) ?? 0) + d.revenue)
    }
    return Array.from(buckets.entries()).map(([key, revenue]) => ({
      label: key.split("-")[1],
      revenue: Math.round(revenue),
    }))
  }

  const buckets = new Map<string, number>()
  for (const d of days) {
    const dt = new Date(d.date)
    const key = `${dt.getFullYear()}-${dt.getMonth()}`
    buckets.set(key, (buckets.get(key) ?? 0) + d.revenue)
  }
  return Array.from(buckets.entries()).map(([key, revenue]) => {
    const month = Number(key.split("-")[1])
    return { label: MONTH_LABELS[month], revenue: Math.round(revenue) }
  })
}

export interface CareBreakdownEntry {
  type: string
  count: number
  revenue: number
}

export function careBreakdown(range: PeriodRange): CareBreakdownEntry[] {
  const days = filterDays(range)
  const map = new Map<string, { count: number; revenue: number }>()
  for (const d of days) {
    for (const act of d.acts) {
      const entry = map.get(act.type) ?? { count: 0, revenue: 0 }
      entry.count += act.count
      entry.revenue += act.revenue
      map.set(act.type, entry)
    }
  }
  return Array.from(map.entries())
    .map(([type, v]) => ({ type, count: v.count, revenue: Math.round(v.revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
}

export interface OccupancyEntry {
  weekday: string
  occupancyPct: number
  avgAppointments: number
}

export function occupancyByWeekday(range: PeriodRange): OccupancyEntry[] {
  const days = filterDays(range).filter((d) => d.slotsAvailable > 0)
  const buckets = new Map<
    number,
    { available: number; used: number; appointments: number; count: number }
  >()
  for (const d of days) {
    const wd = (new Date(d.date).getDay() + 6) % 7 // 0=Mon..6=Sun
    const entry = buckets.get(wd) ?? { available: 0, used: 0, appointments: 0, count: 0 }
    entry.available += d.slotsAvailable
    entry.used += d.slotsUsed
    entry.appointments += d.appointmentsTotal
    entry.count += 1
    buckets.set(wd, entry)
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([wd, v]) => ({
      weekday: WEEKDAY_LABELS[wd],
      occupancyPct: v.available === 0 ? 0 : Math.round((v.used / v.available) * 100),
      avgAppointments: v.count === 0 ? 0 : Math.round((v.appointments / v.count) * 10) / 10,
    }))
}

export interface PortfolioPoint {
  label: string
  existing: number
  new: number
  total: number
}

export function portfolioGrowth(range: PeriodRange): PortfolioPoint[] {
  const days = filterDays(range)
  const groupBy = groupByForRange(range)

  // cumulative new patients from the start of the whole dataset up to the range start
  const startKey = toKey(range.start)
  let cumulativeBeforeRange = portfolioBaseline
  for (const d of allDays) {
    if (d.date >= startKey) break
    cumulativeBeforeRange += d.newPatients
  }

  const points: PortfolioPoint[] = []
  let runningNew = 0

  const pushPoint = (label: string, newInBucket: number) => {
    runningNew += newInBucket
    const total = cumulativeBeforeRange + runningNew
    points.push({ label, existing: cumulativeBeforeRange, new: runningNew, total })
  }

  if (groupBy === "day") {
    for (const d of days) {
      pushPoint(
        new Date(d.date).toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
        d.newPatients
      )
    }
  } else if (groupBy === "week") {
    const buckets = new Map<string, number>()
    const order: string[] = []
    for (const d of days) {
      const key = isoWeekKey(new Date(d.date))
      if (!buckets.has(key)) order.push(key)
      buckets.set(key, (buckets.get(key) ?? 0) + d.newPatients)
    }
    for (const key of order) {
      pushPoint(key.split("-")[1], buckets.get(key) ?? 0)
    }
  } else {
    const buckets = new Map<string, number>()
    const order: string[] = []
    for (const d of days) {
      const dt = new Date(d.date)
      const key = `${dt.getFullYear()}-${dt.getMonth()}`
      if (!buckets.has(key)) order.push(key)
      buckets.set(key, (buckets.get(key) ?? 0) + d.newPatients)
    }
    for (const key of order) {
      const month = Number(key.split("-")[1])
      pushPoint(MONTH_LABELS[month], buckets.get(key) ?? 0)
    }
  }

  return points
}

export interface TopAct {
  type: string
  count: number
  revenue: number
}

export function topActs(range: PeriodRange, limit = 10): TopAct[] {
  return careBreakdown(range)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export interface CancellationStats {
  cancelledRate: number
  noShowRate: number
  cancelledRateChangePct: number | null
  noShowRateChangePct: number | null
  weekly: { label: string; rate: number }[]
}

export function cancellationStats(range: PeriodRange): CancellationStats {
  const days = filterDays(range)
  const previous = filterDays(previousRange(range))

  const rates = (list: DayRecord[]) => {
    const total = list.reduce((a, d) => a + d.appointmentsTotal, 0)
    const cancelled = list.reduce((a, d) => a + d.cancelled, 0)
    const noShow = list.reduce((a, d) => a + d.noShow, 0)
    return {
      cancelledRate: total === 0 ? 0 : (cancelled / total) * 100,
      noShowRate: total === 0 ? 0 : (noShow / total) * 100,
    }
  }

  const current = rates(days)
  const prev = rates(previous)

  const buckets = new Map<string, { total: number; bad: number }>()
  const order: string[] = []
  for (const d of days) {
    const key = isoWeekKey(new Date(d.date))
    if (!buckets.has(key)) order.push(key)
    const entry = buckets.get(key) ?? { total: 0, bad: 0 }
    entry.total += d.appointmentsTotal
    entry.bad += d.cancelled + d.noShow
    buckets.set(key, entry)
  }

  return {
    cancelledRate: current.cancelledRate,
    noShowRate: current.noShowRate,
    cancelledRateChangePct: pctChange(current.cancelledRate, prev.cancelledRate),
    noShowRateChangePct: pctChange(current.noShowRate, prev.noShowRate),
    weekly: order.map((key) => {
      const v = buckets.get(key)!
      return {
        label: key.split("-")[1],
        rate: v.total === 0 ? 0 : Math.round((v.bad / v.total) * 1000) / 10,
      }
    }),
  }
}
