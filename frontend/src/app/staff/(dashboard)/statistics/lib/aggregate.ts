// Date-range helpers for the Statistics page. All the actual data
// crunching (KPIs, revenue series, care breakdown, occupancy, patient
// growth, top acts, cancellation stats) now happens server-side in
// app/api/v1/stats.py — this file only turns a preset into a concrete
// {start, end} range for the API call and back into query-string dates.

export type PeriodPreset = "today" | "7d" | "30d" | "3m" | "year" | "custom"

export interface PeriodRange {
  start: Date
  end: Date
}

const addDays = (d: Date, n: number) => {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

export function presetToRange(preset: PeriodPreset, custom?: PeriodRange): PeriodRange {
  const today = new Date()
  switch (preset) {
    case "today":
      return { start: today, end: today }
    case "7d":
      return { start: addDays(today, -6), end: today }
    case "30d":
      return { start: addDays(today, -29), end: today }
    case "3m":
      return { start: addDays(today, -89), end: today }
    case "year":
      return { start: new Date(today.getFullYear(), 0, 1), end: today }
    case "custom":
      return custom ?? { start: addDays(today, -29), end: today }
  }
}

export function toDateParam(d: Date): string {
  return d.toISOString().split("T")[0]
}