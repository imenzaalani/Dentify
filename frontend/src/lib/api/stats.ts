import { apiRequest } from "./client"
import type { GroupBy, StatsFull, StatsOperational, UnpaidInvoice } from "@/types/stats"

export const statsApi = {
  async getOperational(start: string, end: string): Promise<StatsOperational> {
    return apiRequest<StatsOperational>(`/stats/operational?start=${start}&end=${end}`)
  },

  async getFull(start: string, end: string, groupBy?: GroupBy): Promise<StatsFull> {
    const search = new URLSearchParams({ start, end })
    if (groupBy) search.set("group_by", groupBy)
    return apiRequest<StatsFull>(`/stats/full?${search.toString()}`)
  },

  async getUnpaidInvoices(): Promise<UnpaidInvoice[]> {
    return apiRequest<UnpaidInvoice[]>(`/stats/unpaid-invoices`)
  },
}