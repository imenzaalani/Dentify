from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.permissions import Category, Role, can_read
from app.models.appointment import Appointment
from app.models.care_type import CareType
from app.models.invoice import Invoice
from app.models.patient import Patient
from app.models.resource import Resource
from app.models.user import User
from app.schemas.stats import (
    CancellationStats,
    CancellationWeeklyPoint,
    CareBreakdownEntry,
    KpisOut,
    KpiValue,
    OccupancyEntry,
    PortfolioPoint,
    RevenuePoint,
    StatsFullOut,
    StatsOperationalOut,
    TopAct,
    UnpaidInvoiceOut,
)

router = APIRouter(prefix="/stats", tags=["stats"])

STAFF_ALL = (Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)

WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

# No clinic-hours/working-calendar configuration exists yet, so occupancy is
# an approximation against a flat assumption: every active resource (chair/
# room) offers an 8-hour day, six days a week (closed Sundays). Revisit once
# a real opening-hours config exists — this is the one number in this file
# that isn't a direct read of stored data.
BUSINESS_HOURS_PER_DAY = 8
CLOSED_WEEKDAY = 6  # Python weekday(): 0=Mon..6=Sun


def _require_stats_read(user: User, category: Category) -> None:
    if not can_read(Role(user.role), category):
        detail = (
            "Only the owner can view revenue and consolidated statistics"
            if category == Category.STATS_FULL
            else "Not authorized to view these statistics"
        )
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail)


def _validate_range(start: date, end: date) -> None:
    if end < start:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "end must not be before start")


def _range_bounds(start: date, end: date) -> tuple[datetime, datetime]:
    return (
        datetime.combine(start, time.min, tzinfo=timezone.utc),
        datetime.combine(end, time.max, tzinfo=timezone.utc),
    )


def _previous_range(start: date, end: date) -> tuple[date, date]:
    span_days = (end - start).days + 1
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=span_days - 1)
    return prev_start, prev_end


def _group_by(start: date, end: date) -> str:
    span_days = (end - start).days + 1
    if span_days <= 14:
        return "day"
    if span_days <= 120:
        return "week"
    return "month"


def _iso_week_key(d: date) -> str:
    year, week, _ = d.isocalendar()
    return f"{year}-W{week:02d}"


def _bucket_key(d: date, group_by: str) -> str:
    if group_by == "day":
        return d.isoformat()
    if group_by == "week":
        return _iso_week_key(d)
    return f"{d.year}-{d.month:02d}"


def _bucket_label(key: str, group_by: str) -> str:
    if group_by == "day":
        return date.fromisoformat(key).strftime("%d %b")
    if group_by == "week":
        return key.split("-W")[1]
    year, month = key.split("-")
    return f"{MONTH_LABELS[int(month) - 1]} {year[2:]}"


def _all_bucket_keys(start: date, end: date, group_by: str) -> list[str]:
    keys: list[str] = []
    seen: set[str] = set()
    d = start
    while d <= end:
        key = _bucket_key(d, group_by)
        if key not in seen:
            seen.add(key)
            keys.append(key)
        d += timedelta(days=1)
    return keys


def _pct_change(current: float, previous: float) -> float | None:
    if previous == 0:
        return 0.0 if current == 0 else None
    return (current - previous) / previous * 100


async def _completed_appointments(
    db: AsyncSession, start: date, end: date
) -> list[tuple[Appointment, str, float]]:
    start_dt, end_dt = _range_bounds(start, end)
    result = await db.execute(
        select(Appointment, CareType.name, CareType.price)
        .join(CareType, Appointment.care_type_id == CareType.id)
        .where(
            Appointment.status == "completed",
            Appointment.scheduled_at >= start_dt,
            Appointment.scheduled_at <= end_dt,
        )
    )
    return [(a, name, float(price) if price is not None else 0.0) for a, name, price in result.all()]


async def _all_appointments(db: AsyncSession, start: date, end: date) -> list[Appointment]:
    start_dt, end_dt = _range_bounds(start, end)
    result = await db.execute(
        select(Appointment).where(
            Appointment.scheduled_at >= start_dt, Appointment.scheduled_at <= end_dt
        )
    )
    return list(result.scalars().all())


async def _new_patients(db: AsyncSession, start: date, end: date) -> list[Patient]:
    start_dt, end_dt = _range_bounds(start, end)
    result = await db.execute(
        select(Patient).where(Patient.created_at >= start_dt, Patient.created_at <= end_dt)
    )
    return list(result.scalars().all())


async def _patients_before(db: AsyncSession, start: date) -> int:
    start_dt, _ = _range_bounds(start, start)
    result = await db.execute(
        select(func.count()).select_from(Patient).where(Patient.created_at < start_dt)
    )
    return result.scalar_one()


async def _active_resource_count(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count()).select_from(Resource).where(Resource.active.is_(True))
    )
    return result.scalar_one()


def _occupancy_rate(
    appts: list[Appointment], lo: date, hi: date, active_resources: int
) -> float:
    booked_minutes = sum(
        (a.duration_minutes or 0)
        for a in appts
        if a.status not in ("cancelled", "no_show") and lo <= a.scheduled_at.date() <= hi
    )
    working_days = sum(
        1 for i in range((hi - lo).days + 1) if (lo + timedelta(days=i)).weekday() != CLOSED_WEEKDAY
    )
    available_minutes = active_resources * working_days * BUSINESS_HOURS_PER_DAY * 60
    return 0.0 if available_minutes == 0 else booked_minutes / available_minutes * 100


def _occupancy_by_weekday(
    appts_in_range: list[Appointment], start: date, end: date, active_resources: int
) -> list[OccupancyEntry]:
    buckets: dict[int, dict[str, int]] = {}
    d = start
    while d <= end:
        wd = d.weekday()
        entry = buckets.setdefault(wd, {"available_min": 0, "used_min": 0, "appt_count": 0, "day_count": 0})
        entry["available_min"] += active_resources * BUSINESS_HOURS_PER_DAY * 60
        entry["day_count"] += 1
        d += timedelta(days=1)

    for a in appts_in_range:
        wd = a.scheduled_at.date().weekday()
        if wd not in buckets:
            continue
        buckets[wd]["appt_count"] += 1
        if a.status not in ("cancelled", "no_show"):
            buckets[wd]["used_min"] += a.duration_minutes or 0

    entries: list[OccupancyEntry] = []
    for wd in sorted(buckets):
        b = buckets[wd]
        occ = 0.0 if b["available_min"] == 0 else round(b["used_min"] / b["available_min"] * 100)
        avg = 0.0 if b["day_count"] == 0 else round(b["appt_count"] / b["day_count"], 1)
        entries.append(OccupancyEntry(weekday=WEEKDAY_LABELS[wd], occupancy_pct=occ, avg_appointments=avg))
    return entries


def _rates(appts: list[Appointment]) -> tuple[float, float]:
    total = len(appts)
    if total == 0:
        return 0.0, 0.0
    cancelled = sum(1 for a in appts if a.status == "cancelled")
    no_show = sum(1 for a in appts if a.status == "no_show")
    return cancelled / total * 100, no_show / total * 100


def _cancellation_stats(
    current_appts: list[Appointment], previous_appts: list[Appointment]
) -> CancellationStats:
    cur_cancelled, cur_no_show = _rates(current_appts)
    prev_cancelled, prev_no_show = _rates(previous_appts)

    buckets: dict[str, dict[str, int]] = {}
    order: list[str] = []
    for a in sorted(current_appts, key=lambda a: a.scheduled_at):
        key = _iso_week_key(a.scheduled_at.date())
        if key not in buckets:
            buckets[key] = {"total": 0, "bad": 0}
            order.append(key)
        buckets[key]["total"] += 1
        if a.status in ("cancelled", "no_show"):
            buckets[key]["bad"] += 1

    weekly = [
        CancellationWeeklyPoint(
            label=key.split("-W")[1],
            rate=round(buckets[key]["bad"] / buckets[key]["total"] * 100, 1) if buckets[key]["total"] else 0.0,
        )
        for key in order
    ]

    return CancellationStats(
        cancelled_rate=round(cur_cancelled, 1),
        no_show_rate=round(cur_no_show, 1),
        cancelled_rate_change_pct=_pct_change(cur_cancelled, prev_cancelled),
        no_show_rate_change_pct=_pct_change(cur_no_show, prev_no_show),
        weekly=weekly,
    )


@router.get("/operational", response_model=StatsOperationalOut)
async def get_operational_stats(
    start: date = Query(...),
    end: date = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> StatsOperationalOut:
    _require_stats_read(current_user, Category.STATS_OPERATIONAL)
    _validate_range(start, end)

    prev_start, prev_end = _previous_range(start, end)
    all_appts = await _all_appointments(db, prev_start, end)
    current_appts = [a for a in all_appts if start <= a.scheduled_at.date() <= end]
    previous_appts = [a for a in all_appts if prev_start <= a.scheduled_at.date() <= prev_end]

    active_resources = await _active_resource_count(db)

    return StatsOperationalOut(
        occupancy=_occupancy_by_weekday(current_appts, start, end, active_resources),
        cancellations=_cancellation_stats(current_appts, previous_appts),
    )


@router.get("/full", response_model=StatsFullOut)
async def get_full_stats(
    start: date = Query(...),
    end: date = Query(...),
    group_by: str | None = Query(None, pattern="^(day|week|month)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> StatsFullOut:
    _require_stats_read(current_user, Category.STATS_FULL)
    _validate_range(start, end)

    prev_start, prev_end = _previous_range(start, end)

    appt_rows = await _completed_appointments(db, prev_start, end)
    current_rows = [r for r in appt_rows if start <= r[0].scheduled_at.date() <= end]
    previous_rows = [r for r in appt_rows if prev_start <= r[0].scheduled_at.date() <= prev_end]

    patients = await _new_patients(db, prev_start, end)
    current_patients = [p for p in patients if start <= p.created_at.date() <= end]
    previous_patients = [p for p in patients if prev_start <= p.created_at.date() <= prev_end]

    all_appts = await _all_appointments(db, prev_start, end)
    active_resources = await _active_resource_count(db)

    revenue_cur = round(sum(price for _, _, price in current_rows), 2)
    revenue_prev = round(sum(price for _, _, price in previous_rows), 2)
    seen_cur = len({a.patient_id for a, _, _ in current_rows})
    seen_prev = len({a.patient_id for a, _, _ in previous_rows})
    new_cur = len(current_patients)
    new_prev = len(previous_patients)
    occ_cur = _occupancy_rate(all_appts, start, end, active_resources)
    occ_prev = _occupancy_rate(all_appts, prev_start, prev_end, active_resources)

    kpis = KpisOut(
        patients_seen=KpiValue(value=seen_cur, change_pct=_pct_change(seen_cur, seen_prev)),
        new_patients=KpiValue(value=new_cur, change_pct=_pct_change(new_cur, new_prev)),
        revenue=KpiValue(value=revenue_cur, change_pct=_pct_change(revenue_cur, revenue_prev)),
        occupancy_rate=KpiValue(value=round(occ_cur, 1), change_pct=_pct_change(occ_cur, occ_prev)),
    )

    effective_group_by = group_by or _group_by(start, end)
    bucket_keys = _all_bucket_keys(start, end, effective_group_by)

    rev_sums = {k: 0.0 for k in bucket_keys}
    for a, _, price in current_rows:
        key = _bucket_key(a.scheduled_at.date(), effective_group_by)
        if key in rev_sums:
            rev_sums[key] += price
    revenue_series = [
        RevenuePoint(label=_bucket_label(k, effective_group_by), revenue=round(rev_sums[k], 2))
        for k in bucket_keys
    ]

    new_counts = {k: 0 for k in bucket_keys}
    for p in current_patients:
        key = _bucket_key(p.created_at.date(), effective_group_by)
        if key in new_counts:
            new_counts[key] += 1
    baseline = await _patients_before(db, start)
    patient_growth: list[PortfolioPoint] = []
    running_new = 0
    for k in bucket_keys:
        running_new += new_counts[k]
        patient_growth.append(
            PortfolioPoint(
                label=_bucket_label(k, effective_group_by),
                existing=baseline,
                new=running_new,
                total=baseline + running_new,
            )
        )

    care_map: dict[str, dict[str, float]] = {}
    for _, name, price in current_rows:
        entry = care_map.setdefault(name, {"count": 0, "revenue": 0.0})
        entry["count"] += 1
        entry["revenue"] += price
    care_breakdown = sorted(
        [
            CareBreakdownEntry(type=k, count=int(v["count"]), revenue=round(v["revenue"], 2))
            for k, v in care_map.items()
        ],
        key=lambda e: e.revenue,
        reverse=True,
    )
    top_acts = sorted(
        [TopAct(type=e.type, count=e.count, revenue=e.revenue) for e in care_breakdown],
        key=lambda e: e.count,
        reverse=True,
    )[:10]

    return StatsFullOut(
        group_by=effective_group_by,
        kpis=kpis,
        revenue_series=revenue_series,
        care_breakdown=care_breakdown,
        patient_growth=patient_growth,
        top_acts=top_acts,
    )


@router.get("/unpaid-invoices", response_model=list[UnpaidInvoiceOut])
async def get_unpaid_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> list[UnpaidInvoiceOut]:
    """Overdue/partially-paid invoices — the same billing data visible on
    the invoice list, just pre-filtered and sorted by days overdue, so no
    extra permission tier beyond ordinary billing read access.
    """
    result = await db.execute(
        select(Invoice).where(Invoice.doc_type == "invoice", Invoice.status.notin_(["paid", "draft"]))
    )
    invoices = result.scalars().all()

    today = date.today()
    out: list[UnpaidInvoiceOut] = []
    for inv in invoices:
        if inv.balance <= 0 or not inv.due_date:
            continue
        due = date.fromisoformat(inv.due_date)
        patient = inv.patient
        patient_name = f"{patient.first_name} {patient.last_name}" if patient else ""
        out.append(
            UnpaidInvoiceOut(
                id=inv.id,
                number=inv.number,
                patient_id=inv.patient_id,
                patient_name=patient_name,
                balance=float(inv.balance),
                due_date=inv.due_date,
                days_overdue=max(0, (today - due).days),
            )
        )
    out.sort(key=lambda i: i.days_overdue, reverse=True)
    return out