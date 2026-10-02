from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.permissions import Role
from app.models.appointment import Appointment
from app.models.care_type import CareType
from app.models.patient import Patient
from app.models.user import User
from app.models.waitlist import WaitlistEntry
from app.schemas.waitlist import (
    WaitlistEntryCreate,
    WaitlistEntryOut,
    WaitlistEntryUpdate,
    WaitlistScheduleRequest,
)

router = APIRouter(prefix="/waitlist", tags=["waitlist"])

# PLANNING category: read+write for all staff roles, same as appointments/resources.
STAFF = (Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)

TERMINAL_STATUSES = {"scheduled", "cancelled"}


async def _get_or_404(db: AsyncSession, model, entity_id: UUID, label: str):
    obj = await db.get(model, entity_id)
    if not obj:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return obj


@router.get("/", response_model=list[WaitlistEntryOut])
async def list_waitlist(
    entry_status: str | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> list[WaitlistEntry]:
    stmt = select(WaitlistEntry)
    if entry_status:
        stmt = stmt.where(WaitlistEntry.status == entry_status)
    stmt = stmt.order_by(WaitlistEntry.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=WaitlistEntryOut, status_code=status.HTTP_201_CREATED)
async def create_waitlist_entry(
    payload: WaitlistEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> WaitlistEntry:
    await _get_or_404(db, Patient, payload.patient_id, "Patient")
    await _get_or_404(db, CareType, payload.care_type_id, "Care type")

    entry = WaitlistEntry(**payload.model_dump(), created_by=current_user.id)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.patch("/{entry_id}", response_model=WaitlistEntryOut)
async def update_waitlist_entry(
    entry_id: UUID,
    payload: WaitlistEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> WaitlistEntry:
    entry = await _get_or_404(db, WaitlistEntry, entry_id, "Waitlist entry")
    if entry.status in TERMINAL_STATUSES:
        raise HTTPException(status_code=409, detail=f"Cannot edit a '{entry.status}' waitlist entry")

    updates = payload.model_dump(exclude_unset=True)
    if "care_type_id" in updates:
        await _get_or_404(db, CareType, updates["care_type_id"], "Care type")

    for field, value in updates.items():
        setattr(entry, field, value)

    await db.commit()
    await db.refresh(entry)
    return entry


@router.post("/{entry_id}/contacted", response_model=WaitlistEntryOut)
async def mark_contacted(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> WaitlistEntry:
    entry = await _get_or_404(db, WaitlistEntry, entry_id, "Waitlist entry")
    if entry.status != "waiting":
        raise HTTPException(status_code=409, detail=f"Cannot mark a '{entry.status}' entry as contacted")
    entry.status = "contacted"
    await db.commit()
    await db.refresh(entry)
    return entry


@router.post("/{entry_id}/schedule", response_model=WaitlistEntryOut)
async def schedule_waitlist_entry(
    entry_id: UUID,
    payload: WaitlistScheduleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> WaitlistEntry:
    """Called right after the receptionist saves the appointment created
    from this entry (see WaitlistPanel's "Planifier" action) — links the
    two records and moves the entry out of the active waiting list.
    """
    entry = await _get_or_404(db, WaitlistEntry, entry_id, "Waitlist entry")
    if entry.status in TERMINAL_STATUSES:
        raise HTTPException(status_code=409, detail=f"Cannot schedule a '{entry.status}' entry")
    await _get_or_404(db, Appointment, payload.appointment_id, "Appointment")

    entry.status = "scheduled"
    entry.appointment_id = payload.appointment_id
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_waitlist_entry(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF)),
) -> None:
    entry = await _get_or_404(db, WaitlistEntry, entry_id, "Waitlist entry")
    await db.delete(entry)
    await db.commit()