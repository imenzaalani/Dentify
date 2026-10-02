import calendar
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.permissions import Role
from app.models.appointment import Appointment
from app.models.appointment_series import AppointmentSeries
from app.models.care_type import CareType
from app.models.patient import Patient
from app.models.resource import Resource
from app.models.treatment import TreatmentStep
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCancelRequest,
    AppointmentCreate,
    AppointmentOut,
    AppointmentSeriesOut,
    AppointmentUpdate,
    MAX_SERIES_OCCURRENCES,
    RecurringAppointmentCreate,
    RecurringAppointmentCreateResponse,
    SeriesCancelRequest,
    SkippedOccurrence,
)
from app.services.email import send_appointment_confirmation_email

router = APIRouter(prefix="/appointments", tags=["appointments"])


async def _send_and_record_confirmation(
    db: AsyncSession,
    appointment: Appointment,
    *,
    should_send: bool,
    patient_email: str | None,
    patient_name: str,
    dentist_name: str,
) -> None:
    """Attempt the confirmation email and persist what happened.

    Runs after the appointment row is already committed, so a send failure
    here must never bubble up as a 500 — the appointment exists either way;
    all this does is record whether the patient was actually notified.
    """
    if not should_send or not patient_email:
        appointment.confirmation_delivery_status = "not_requested"
    else:
        try:
            await send_appointment_confirmation_email(
                patient_email,
                patient_name,
                dentist_name,
                appointment.scheduled_at.isoformat(),
            )
        except Exception:
            appointment.confirmation_delivery_status = "failed"
        else:
            appointment.confirmation_delivery_status = "sent"
            appointment.confirmation_sent_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(appointment)

# PLANNING category: read+write for all staff roles.
STAFF = (Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)

ACTIVE_STATUSES = {"pending", "confirmed", "arrived"}
TERMINAL_STATUSES = {"completed", "cancelled", "no_show"}

# Minimum gap required between two appointments for the same dentist, or on
# the same chair/room, for cleanup/turnover. Mirrors DEFAULT_BUFFER_MINUTES
# in the frontend's planning/availability.ts — the two aren't wired to a
# shared source yet (no practice-settings table), so keep them in sync by
# hand until that lands.
BUFFER_MINUTES = 10


def _overlaps(a_start: datetime, a_minutes: int, b_start: datetime, b_minutes: int) -> bool:
    a_end = a_start + timedelta(minutes=a_minutes)
    b_end = b_start + timedelta(minutes=b_minutes)
    return a_start < b_end and b_start < a_end


def _overlaps_with_buffer(
    a_start: datetime, a_minutes: int, b_start: datetime, b_minutes: int, buffer_minutes: int
) -> bool:
    """Same test as _overlaps, but each side's window is padded by
    buffer_minutes first. True for a literal overlap *or* a gap smaller
    than the required buffer; false once there's enough clear time between
    them. Call _overlaps first to distinguish a real double-booking from a
    buffer-only violation — this alone can't tell them apart."""
    a_end = a_start + timedelta(minutes=a_minutes)
    b_end = b_start + timedelta(minutes=b_minutes)
    pad = timedelta(minutes=buffer_minutes)
    return a_start < b_end + pad and b_start < a_end + pad


async def _assert_no_conflict(
    db: AsyncSession,
    *,
    dentist_id: UUID,
    resource_id: UUID | None,
    scheduled_at: datetime,
    duration_minutes: int,
    exclude_id: UUID | None = None,
    buffer_minutes: int = BUFFER_MINUTES,
) -> None:
    day_start = datetime.combine(scheduled_at.date(), datetime.min.time(), tzinfo=scheduled_at.tzinfo)
    day_end = day_start + timedelta(days=1)

    stmt = select(Appointment).where(
        Appointment.scheduled_at >= day_start,
        Appointment.scheduled_at < day_end,
        Appointment.status.in_(ACTIVE_STATUSES),
    )
    if exclude_id is not None:
        stmt = stmt.where(Appointment.id != exclude_id)

    result = await db.execute(stmt)
    existing_appointments = result.scalars().all()

    # Pass 1: literal double-booking — same dentist or same chair/room with
    # actually overlapping time ranges. Always a hard conflict, buffer or not.
    for existing in existing_appointments:
        if not _overlaps(existing.scheduled_at, existing.duration_minutes, scheduled_at, duration_minutes):
            continue
        if existing.dentist_id == dentist_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This practitioner already has an appointment in that time slot",
            )
        if resource_id is not None and existing.resource_id == resource_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This chair/room is already booked in that time slot",
            )

    # Pass 2: no literal overlap, but not enough turnover time either — same
    # dentist or same chair/room within buffer_minutes of an existing
    # appointment. Softer than pass 1 (not an actual double-booking) but
    # still rejected: the UI already disables these slots (see the "buffer"
    # SlotStatus in planning/availability.ts), this is the server-side
    # backstop for API clients and race conditions between two staff booking
    # at once.
    if buffer_minutes > 0:
        for existing in existing_appointments:
            if not _overlaps_with_buffer(
                existing.scheduled_at, existing.duration_minutes, scheduled_at, duration_minutes, buffer_minutes
            ):
                continue
            if existing.dentist_id == dentist_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Leave at least {buffer_minutes} minutes between this practitioner's appointments",
                )
            if resource_id is not None and existing.resource_id == resource_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Leave at least {buffer_minutes} minutes between appointments on this chair/room",
                )


def _add_months(dt: datetime, months: int) -> datetime:
    """Add whole calendar months to dt, clamping the day if the target
    month is shorter (e.g. Jan 31 + 1 month -> Feb 28/29, not Mar 3)."""
    month_index = dt.month - 1 + months
    year = dt.year + month_index // 12
    month = month_index % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def _generate_occurrences(
    first: datetime, frequency: str, *, count: int | None, until: date | None
) -> list[datetime]:
    """First occurrence plus every subsequent one up to (and including)
    'count' total occurrences, or up to (and including) 'until'. Exactly
    one of count/until is set — enforced by RecurrenceRule's validator.
    Capped at MAX_SERIES_OCCURRENCES regardless, as a hard backstop."""
    step = {"weekly": 1, "biweekly": 2, "monthly": None}[frequency]

    occurrences = [first]
    while True:
        if count is not None and len(occurrences) >= count:
            break
        if len(occurrences) >= MAX_SERIES_OCCURRENCES:
            break
        next_dt = _add_months(occurrences[-1], 1) if step is None else occurrences[-1] + timedelta(weeks=step)
        if until is not None and next_dt.date() > until:
            break
        occurrences.append(next_dt)

    return occurrences


async def _get_or_404(db: AsyncSession, model, entity_id: UUID, label: str):
    obj = await db.get(model, entity_id)
    if not obj:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return obj


def _transition(appt: Appointment, *, allowed_from: set[str], to: str) -> None:
    if appt.status not in allowed_from:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot move appointment from '{appt.status}' to '{to}'",
        )
    appt.status = to


@router.get("/", response_model=list[AppointmentOut])
async def list_appointments(
    day: date | None = Query(None, description="Filter to a single day"),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    dentist_id: UUID | None = Query(None),
    patient_id: UUID | None = Query(None),
    appt_status: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> list[Appointment]:
    stmt = select(Appointment)

    if day:
        # Use UTC midnight for day filtering, because stored appointments are
        # timezone-aware (timestamptz). A naive midnight can compare incorrectly
        # against TZ-aware Postgres timestamps when the server/session timezone
        # differs from the appointment's tzinfo.
        day_start = datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        stmt = stmt.where(Appointment.scheduled_at >= day_start, Appointment.scheduled_at < day_end)
    if date_from:
        stmt = stmt.where(Appointment.scheduled_at >= date_from)
    if date_to:
        stmt = stmt.where(Appointment.scheduled_at < date_to)
    if dentist_id:
        stmt = stmt.where(Appointment.dentist_id == dentist_id)
    if patient_id:
        stmt = stmt.where(Appointment.patient_id == patient_id)
    if appt_status:
        stmt = stmt.where(Appointment.status == appt_status)

    stmt = stmt.order_by(Appointment.scheduled_at)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/recurring", response_model=RecurringAppointmentCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_recurring_appointments(
    payload: RecurringAppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> RecurringAppointmentCreateResponse:
    await _get_or_404(db, Patient, payload.patient_id, "Patient")
    dentist = await _get_or_404(db, User, payload.dentist_id, "Dentist")
    await _get_or_404(db, CareType, payload.care_type_id, "Care type")
    if payload.resource_id is not None:
        await _get_or_404(db, Resource, payload.resource_id, "Resource")

    occurrences = _generate_occurrences(
        payload.scheduled_at,
        payload.recurrence.frequency.value,
        count=payload.recurrence.count,
        until=payload.recurrence.until,
    )

    series = AppointmentSeries(
        patient_id=payload.patient_id,
        dentist_id=payload.dentist_id,
        care_type_id=payload.care_type_id,
        resource_id=payload.resource_id,
        frequency=payload.recurrence.frequency.value,
        occurrence_count=payload.recurrence.count,
        until=payload.recurrence.until,
        duration_minutes=payload.duration_minutes,
        send_confirmation=payload.send_confirmation,
        prep_notes=payload.prep_notes,
        internal_notes=payload.internal_notes,
        created_by=current_user.id,
    )
    db.add(series)
    await db.flush()  # assign series.id without committing yet

    created: list[Appointment] = []
    skipped: list[SkippedOccurrence] = []

    for index, scheduled_at in enumerate(occurrences, start=1):
        try:
            await _assert_no_conflict(
                db,
                dentist_id=payload.dentist_id,
                resource_id=payload.resource_id,
                scheduled_at=scheduled_at,
                duration_minutes=payload.duration_minutes,
            )
        except HTTPException as exc:
            skipped.append(SkippedOccurrence(scheduled_at=scheduled_at, reason=exc.detail))
            continue

        appointment = Appointment(
            patient_id=payload.patient_id,
            dentist_id=payload.dentist_id,
            care_type_id=payload.care_type_id,
            resource_id=payload.resource_id,
            scheduled_at=scheduled_at,
            duration_minutes=payload.duration_minutes,
            send_confirmation=payload.send_confirmation,
            prep_notes=payload.prep_notes,
            internal_notes=payload.internal_notes,
            series_id=series.id,
            series_occurrence_index=index,
            created_by=current_user.id,
            updated_by=current_user.id,
        )
        db.add(appointment)
        # Flush (not commit) so this occurrence is visible to the conflict
        # check on the next loop iteration — otherwise two occurrences in
        # the same request could double-book the same slot.
        await db.flush()
        created.append(appointment)

    await db.commit()
    await db.refresh(series)
    for appointment in created:
        await db.refresh(appointment)

    patient = await _get_or_404(db, Patient, payload.patient_id, "Patient")
    for appointment in created:
        await _send_and_record_confirmation(
            db,
            appointment,
            should_send=payload.send_confirmation,
            patient_email=patient.email,
            patient_name=f"{patient.first_name} {patient.last_name}",
            dentist_name=f"Dr. {dentist.first_name} {dentist.last_name}",
        )

    return RecurringAppointmentCreateResponse(series=series, created=created, skipped=skipped)


@router.get("/series/{series_id}", response_model=list[AppointmentOut])
async def list_series_appointments(
    series_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> list[Appointment]:
    await _get_or_404(db, AppointmentSeries, series_id, "Appointment series")
    stmt = (
        select(Appointment)
        .where(Appointment.series_id == series_id)
        .order_by(Appointment.scheduled_at)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/series/{series_id}/cancel", response_model=list[AppointmentOut])
async def cancel_series(
    series_id: UUID,
    payload: SeriesCancelRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> list[Appointment]:
    await _get_or_404(db, AppointmentSeries, series_id, "Appointment series")

    stmt = select(Appointment).where(
        Appointment.series_id == series_id,
        Appointment.status.in_(ACTIVE_STATUSES),
    )
    if payload.only_future:
        stmt = stmt.where(Appointment.scheduled_at >= datetime.now(timezone.utc))
    result = await db.execute(stmt)
    appointments = result.scalars().all()

    now = datetime.now(timezone.utc)
    for appointment in appointments:
        appointment.status = "cancelled"
        appointment.cancellation_reason = payload.reason
        appointment.cancelled_at = now
        appointment.cancelled_by = current_user.id
        appointment.updated_by = current_user.id

    await db.commit()
    for appointment in appointments:
        await db.refresh(appointment)
    return appointments


@router.get("/{appointment_id}", response_model=AppointmentOut)
async def get_appointment(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> Appointment:
    return await _get_or_404(db, Appointment, appointment_id, "Appointment")


@router.post("/", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    payload: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> Appointment:
    await _get_or_404(db, Patient, payload.patient_id, "Patient")
    dentist = await _get_or_404(db, User, payload.dentist_id, "Dentist")
    await _get_or_404(db, CareType, payload.care_type_id, "Care type")
    if payload.resource_id is not None:
        await _get_or_404(db, Resource, payload.resource_id, "Resource")
    if payload.treatment_step_id is not None:
        await _get_or_404(db, TreatmentStep, payload.treatment_step_id, "Treatment step")

    await _assert_no_conflict(
        db,
        dentist_id=payload.dentist_id,
        resource_id=payload.resource_id,
        scheduled_at=payload.scheduled_at,
        duration_minutes=payload.duration_minutes,
    )

    appointment = Appointment(
        **payload.model_dump(),
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)

    patient = await _get_or_404(db, Patient, payload.patient_id, "Patient")
    await _send_and_record_confirmation(
        db,
        appointment,
        should_send=payload.send_confirmation,
        patient_email=patient.email,
        patient_name=f"{patient.first_name} {patient.last_name}",
        dentist_name=f"Dr. {dentist.first_name} {dentist.last_name}",
    )

    return appointment


@router.patch("/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(
    appointment_id: UUID,
    payload: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> Appointment:
    appointment = await _get_or_404(db, Appointment, appointment_id, "Appointment")

    updates = payload.model_dump(exclude_unset=True)

    if appointment.status in TERMINAL_STATUSES:
        terminal_updates = {"patient_id", "dentist_id", "care_type_id", "resource_id", "scheduled_at", "duration_minutes"}
        if terminal_updates & updates.keys():
            raise HTTPException(
                status_code=409,
                detail="Cannot reschedule a completed/cancelled/no-show appointment",
            )

    if "patient_id" in updates:
        await _get_or_404(db, Patient, updates["patient_id"], "Patient")
    if "dentist_id" in updates:
        await _get_or_404(db, User, updates["dentist_id"], "Dentist")
    if "care_type_id" in updates:
        await _get_or_404(db, CareType, updates["care_type_id"], "Care type")
    if updates.get("resource_id") is not None:
        await _get_or_404(db, Resource, updates["resource_id"], "Resource")
    if updates.get("treatment_step_id") is not None:
        await _get_or_404(db, TreatmentStep, updates["treatment_step_id"], "Treatment step")

    new_dentist_id = updates.get("dentist_id", appointment.dentist_id)
    new_resource_id = updates.get("resource_id", appointment.resource_id)
    new_scheduled_at = updates.get("scheduled_at", appointment.scheduled_at)
    new_duration = updates.get("duration_minutes", appointment.duration_minutes)

    if appointment.status not in TERMINAL_STATUSES:
        await _assert_no_conflict(
            db,
            dentist_id=new_dentist_id,
            resource_id=new_resource_id,
            scheduled_at=new_scheduled_at,
            duration_minutes=new_duration,
            exclude_id=appointment.id,
        )

    for field, value in updates.items():
        setattr(appointment, field, value)
    appointment.updated_by = current_user.id

    await db.commit()
    await db.refresh(appointment)

    if "send_confirmation" in updates and updates["send_confirmation"] and appointment.patient_id is not None:
        patient = await _get_or_404(db, Patient, updates.get("patient_id", appointment.patient_id), "Patient")
        dentist = await _get_or_404(db, User, updates.get("dentist_id", appointment.dentist_id), "Dentist")
        await _send_and_record_confirmation(
            db,
            appointment,
            should_send=True,
            patient_email=patient.email,
            patient_name=f"{patient.first_name} {patient.last_name}",
            dentist_name=f"Dr. {dentist.first_name} {dentist.last_name}",
        )

    return appointment


@router.post("/{appointment_id}/confirm", response_model=AppointmentOut)
async def confirm_appointment(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> Appointment:
    appointment = await _get_or_404(db, Appointment, appointment_id, "Appointment")
    _transition(appointment, allowed_from={"pending"}, to="confirmed")
    appointment.updated_by = current_user.id
    await db.commit()
    await db.refresh(appointment)
    return appointment


@router.post("/{appointment_id}/check-in", response_model=AppointmentOut)
async def check_in_appointment(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> Appointment:
    appointment = await _get_or_404(db, Appointment, appointment_id, "Appointment")
    _transition(appointment, allowed_from={"pending", "confirmed"}, to="arrived")
    appointment.updated_by = current_user.id
    await db.commit()
    await db.refresh(appointment)
    return appointment


@router.post("/{appointment_id}/complete", response_model=AppointmentOut)
async def complete_appointment(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> Appointment:
    appointment = await _get_or_404(db, Appointment, appointment_id, "Appointment")
    _transition(appointment, allowed_from={"arrived"}, to="completed")
    appointment.updated_by = current_user.id
    await db.commit()
    await db.refresh(appointment)
    return appointment


@router.post("/{appointment_id}/no-show", response_model=AppointmentOut)
async def mark_no_show(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> Appointment:
    appointment = await _get_or_404(db, Appointment, appointment_id, "Appointment")
    _transition(appointment, allowed_from={"pending", "confirmed"}, to="no_show")
    appointment.updated_by = current_user.id
    await db.commit()
    await db.refresh(appointment)
    return appointment


@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
async def cancel_appointment(
    appointment_id: UUID,
    payload: AppointmentCancelRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> Appointment:
    appointment = await _get_or_404(db, Appointment, appointment_id, "Appointment")
    _transition(appointment, allowed_from=ACTIVE_STATUSES, to="cancelled")
    appointment.cancellation_reason = payload.reason
    appointment.cancelled_at = datetime.now(appointment.scheduled_at.tzinfo)
    appointment.cancelled_by = current_user.id
    appointment.updated_by = current_user.id
    await db.commit()
    await db.refresh(appointment)
    return appointment