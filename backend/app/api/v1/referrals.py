from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.permissions import Role
from app.models.patient import Patient
from app.models.referral import Referral
from app.models.user import User
from app.schemas.referral import (
    ReferralCreate,
    ReferralOut,
    ReferralStatusUpdate,
    ReferralUpdate,
)

router = APIRouter(prefix="/referrals", tags=["referrals"])

STAFF_CLINICAL = (Role.DENTIST, Role.OWNER)
STAFF_ALL = (Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)


async def _get_referral_or_404(db: AsyncSession, referral_id: UUID) -> Referral:
    referral = await db.get(Referral, referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral


@router.get("/", response_model=list[ReferralOut])
async def list_referrals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> list[Referral]:
    result = await db.execute(select(Referral).order_by(Referral.created_at.desc()))
    return result.scalars().all()


@router.get("/{referral_id}", response_model=ReferralOut)
async def get_referral(
    referral_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_ALL)),
) -> Referral:
    return await _get_referral_or_404(db, referral_id)


@router.post("/", response_model=ReferralOut, status_code=status.HTTP_201_CREATED)
async def create_referral(
    payload: ReferralCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_CLINICAL)),
) -> Referral:
    patient = await db.get(Patient, payload.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    referral = Referral(
        patient_id=payload.patient_id,
        specialist_name=payload.specialist_name,
        specialty=payload.specialty,
        reason=payload.reason,
        date=payload.date,
        notes=payload.notes,
        status="pending",
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(referral)
    await db.commit()
    await db.refresh(referral)
    return referral


@router.patch("/{referral_id}", response_model=ReferralOut)
async def update_referral(
    referral_id: UUID,
    payload: ReferralUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_CLINICAL)),
) -> Referral:
    referral = await _get_referral_or_404(db, referral_id)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(referral, field, value)

    referral.updated_by = current_user.id
    await db.commit()
    await db.refresh(referral)
    return referral


@router.patch("/{referral_id}/status", response_model=ReferralOut)
async def update_referral_status(
    referral_id: UUID,
    payload: ReferralStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*STAFF_CLINICAL)),
) -> Referral:
    referral = await _get_referral_or_404(db, referral_id)
    referral.status = payload.status.value
    referral.updated_by = current_user.id
    await db.commit()
    await db.refresh(referral)
    return referral
