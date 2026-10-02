from __future__ import annotations

import uuid

from pydantic import BaseModel


class KpiValue(BaseModel):
    value: float
    change_pct: float | None


class KpisOut(BaseModel):
    patients_seen: KpiValue
    new_patients: KpiValue
    revenue: KpiValue
    occupancy_rate: KpiValue


class RevenuePoint(BaseModel):
    label: str
    revenue: float


class CareBreakdownEntry(BaseModel):
    type: str
    count: int
    revenue: float


class TopAct(BaseModel):
    type: str
    count: int
    revenue: float


class PortfolioPoint(BaseModel):
    label: str
    existing: int
    new: int
    total: int


class OccupancyEntry(BaseModel):
    weekday: str
    occupancy_pct: float
    avg_appointments: float


class CancellationWeeklyPoint(BaseModel):
    label: str
    rate: float


class CancellationStats(BaseModel):
    cancelled_rate: float
    no_show_rate: float
    cancelled_rate_change_pct: float | None
    no_show_rate_change_pct: float | None
    weekly: list[CancellationWeeklyPoint]


class StatsFullOut(BaseModel):
    """Revenue and consolidated figures — owner only (Category.STATS_FULL).

    "Revenue" = billed value (completed appointments x that care type's
    price), not cash collected — see the invoices/payments slice for
    actual money in hand. Keeping the two separate avoids having to
    reconcile appointments against invoices that may not line up 1:1 or
    fall in the same period.
    """

    group_by: str  # "day" | "week" | "month" — how revenue_series/patient_growth are bucketed
    kpis: KpisOut
    revenue_series: list[RevenuePoint]
    care_breakdown: list[CareBreakdownEntry]
    patient_growth: list[PortfolioPoint]
    top_acts: list[TopAct]


class StatsOperationalOut(BaseModel):
    """Fill rate / no-show rate — visible to receptionists and dentists
    too, not just the owner (Category.STATS_OPERATIONAL).
    """

    occupancy: list[OccupancyEntry]
    cancellations: CancellationStats


class UnpaidInvoiceOut(BaseModel):
    id: uuid.UUID
    number: str
    patient_id: uuid.UUID
    patient_name: str
    balance: float
    due_date: str
    days_overdue: int