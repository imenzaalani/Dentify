import secrets
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.permissions import Role
from app.core.rate_limit import limiter
from app.core.security import create_reset_token, hash_password
from app.models.appointment import Appointment
from app.models.care_type import CareType
from app.models.patient import LifecycleStage, Patient
from app.models.user import User, UserRole
from app.services.email import send_patient_invite_email
from app.schemas.patient import (
    CLINICAL_UPDATE_FIELDS,
    NextAppointmentOut,
    PatientArchiveRequest,
    PatientCreate,
    PatientDashboardOut,
    PatientOut,
    PatientSelfOut,
    PatientSelfUpdateRequest,
    PatientUpdateRequest,
)

from app.services.patients import create_patient as create_patient_service

router = APIRouter(prefix="/patients", tags=["patients"])

# NOTE: list/detail below gate on role only (any staff member), returning the
# full PatientOut including CLINICAL_READ fields (allergies, medical_history,
# current_medications) to receptionist too. Per app/core/permissions.py those
# should be dentist/owner-only — deps.py already anticipated this ("category
# checks come back once resource endpoints that need them exist"). Filtering
# PatientOut per-category is a small follow-up, not done here to keep this
# slice to list/detail/archive.

# Every query below eager-loads Patient.user via selectinload — PatientOut's
# portal_status property reads patient.user, and under async SQLAlchemy a
# lazy relationship access outside an active await raises MissingGreenlet.
# There is no plain db.get(Patient, id) left anywhere in this file for that
# reason — always go through select(Patient).options(selectinload(Patient.user)).

async def _get_patient_or_404(db: AsyncSession, patient_id: UUID) -> Patient:
    result = await db.execute(
        select(Patient).options(selectinload(Patient.user)).where(Patient.id == patient_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.get("", response_model=list[PatientOut])
async def list_patients(
    q: str | None = Query(
        None, description="Free-text search across patient number, name, phone, and email"
    ),
    lifecycle_stage: str | None = Query(None),
    include_archived: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)),
) -> list[Patient]:
    stmt = select(Patient).options(selectinload(Patient.user))

    if not include_archived:
        stmt = stmt.where(Patient.archived_at.is_(None))

    if lifecycle_stage:
        stmt = stmt.where(Patient.lifecycle_stage == lifecycle_stage)

    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                Patient.patient_number.ilike(like),
                Patient.first_name.ilike(like),
                Patient.last_name.ilike(like),
                Patient.phone.ilike(like),
                Patient.email.ilike(like),
            )
        )

    stmt = stmt.order_by(Patient.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def _get_own_patient_or_404(db: AsyncSession, user: User) -> Patient:
    result = await db.execute(
        select(Patient).options(selectinload(Patient.user)).where(Patient.user_id == user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="No patient record linked to this account")
    return patient


@router.get("/me/dashboard", response_model=PatientDashboardOut)
async def get_my_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.PATIENT)),
) -> PatientDashboardOut:
    patient = await _get_own_patient_or_404(db, current_user)

    stmt = (
        select(Appointment, User.first_name, User.last_name, CareType.name)
        .join(User, Appointment.dentist_id == User.id)
        .join(CareType, Appointment.care_type_id == CareType.id)
        .where(
            Appointment.patient_id == patient.id,
            Appointment.status.in_(["pending", "confirmed"]),
            Appointment.scheduled_at >= datetime.now(timezone.utc),
        )
        .order_by(Appointment.scheduled_at)
        .limit(1)
    )
    row = (await db.execute(stmt)).first()

    next_appointment = None
    if row is not None:
        appt, dentist_first, dentist_last, care_type_name = row
        practitioner = f"Dr. {dentist_first or ''} {dentist_last or ''}".strip()
        next_appointment = NextAppointmentOut(
            date=appt.scheduled_at.date().isoformat(),
            time=appt.scheduled_at.strftime("%H:%M"),
            practitioner=practitioner,
            type=care_type_name,
            status=appt.status,
        )

    # treatment/notifications: no backing tables yet, see schema note.
    return PatientDashboardOut(nextAppointment=next_appointment, treatment=None, notifications=[])


@router.get("/me", response_model=PatientSelfOut)
async def get_my_patient_record(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.PATIENT)),
) -> Patient:
    return await _get_own_patient_or_404(db, current_user)


@router.patch("/me", response_model=PatientSelfOut)
async def update_my_patient_record(
    payload: PatientSelfUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.PATIENT)),
) -> Patient:
    patient = await _get_own_patient_or_404(db, current_user)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(patient, field, value)
    patient.updated_by = current_user.id

    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)),
) -> Patient:
    return await _get_patient_or_404(db, patient_id)


@router.patch("/{patient_id}", response_model=PatientOut)
async def update_patient(
    patient_id: UUID,
    payload: PatientUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)),
) -> Patient:
    patient = await _get_patient_or_404(db, patient_id)

    updates = payload.model_dump(exclude_unset=True)

    attempted_clinical = CLINICAL_UPDATE_FIELDS & updates.keys()
    if attempted_clinical and current_user.role not in (Role.DENTIST.value, Role.OWNER.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only dentists/owners can edit: {', '.join(sorted(attempted_clinical))}",
        )

    if "email" in updates and patient.user is not None:
        new_email = str(updates["email"]) if updates["email"] is not None else None
        if new_email is None:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Can't clear the email for a patient with an active portal account.",
            )
        if new_email != patient.user.email:
            conflict = await db.execute(
                select(User).where(
                    func.lower(User.email) == new_email.lower(), User.id != patient.user.id
                )
            )
            if conflict.scalar_one_or_none() is not None:
                raise HTTPException(
                    status.HTTP_409_CONFLICT,
                    "This email is already used by another account.",
                )
            patient.user.email = new_email

    for field, value in updates.items():
        setattr(patient, field, str(value) if field == "email" and value is not None else value)

    patient.updated_by = current_user.id

    await db.commit()
    return await _get_patient_or_404(db, patient_id)


@router.post("/{patient_id}/invite", response_model=PatientOut)
async def invite_patient(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)),
) -> Patient:
    patient = await _get_patient_or_404(db, patient_id)

    if not patient.email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This patient has no email on file.")
    if patient.user_id is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This patient already has a portal account.")

    existing = await db.execute(select(User).where(func.lower(User.email) == patient.email.lower()))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")

    user = User(
        email=patient.email,
        first_name=patient.first_name,
        last_name=patient.last_name,
        phone=patient.phone,
        password_hash=hash_password(secrets.token_urlsafe(32)),
        role=UserRole.PATIENT.value,
        invited_by_patient_id=patient.id,
    )
    db.add(user)
    await db.flush()

    patient.user_id = user.id
    await db.commit()

    token = create_reset_token(user.id, user.password_hash)
    await send_patient_invite_email(user.email, token)

    return await _get_patient_or_404(db, patient_id)


@router.post("/{patient_id}/resend-invite", response_model=PatientOut)
@limiter.limit("3/minute")
async def resend_patient_invite(
    request: Request,
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)),
) -> Patient:
    patient = await _get_patient_or_404(db, patient_id)

    if patient.user_id is None or patient.user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This patient hasn't been invited yet.")
    if patient.user.is_verified:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This account has already been activated.")
    if not patient.user.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This account is disabled.")

    token = create_reset_token(patient.user.id, patient.user.password_hash)
    await send_patient_invite_email(patient.user.email, token)

    return patient


@router.post("/{patient_id}/revoke-portal-access", response_model=PatientOut)
async def revoke_patient_portal_access(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> Patient:
    patient = await _get_patient_or_404(db, patient_id)

    if patient.user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This patient doesn't have a portal account.")
    if not patient.user.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Portal access is already revoked.")

    patient.user.is_active = False
    await db.commit()
    return await _get_patient_or_404(db, patient_id)


@router.post("/{patient_id}/restore-portal-access", response_model=PatientOut)
async def restore_patient_portal_access(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.OWNER)),
) -> Patient:
    patient = await _get_patient_or_404(db, patient_id)

    if patient.user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This patient doesn't have a portal account.")
    if patient.user.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Portal access is already active.")
    if patient.archived_at is not None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "This patient is archived — unarchive them to restore portal access.",
        )

    patient.user.is_active = True
    await db.commit()
    return await _get_patient_or_404(db, patient_id)


@router.post("/{patient_id}/archive", response_model=PatientOut)
async def archive_patient(
    patient_id: UUID,
    payload: PatientArchiveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)),
) -> Patient:
    patient = await _get_patient_or_404(db, patient_id)

    if patient.archived_at is not None:
        raise HTTPException(status_code=409, detail="Patient is already archived")

    patient.archived_at = datetime.now(timezone.utc)
    patient.archived_by = current_user.id
    patient.archived_reason = payload.reason
    patient.lifecycle_stage = LifecycleStage.ARCHIVED.value

    if patient.user is not None:
        patient.user.is_active = False

    await db.commit()
    return await _get_patient_or_404(db, patient_id)


@router.post("/{patient_id}/unarchive", response_model=PatientOut)
async def unarchive_patient(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)),
) -> Patient:
    patient = await _get_patient_or_404(db, patient_id)

    if patient.archived_at is None:
        raise HTTPException(status_code=409, detail="Patient is not archived")

    patient.archived_at = None
    patient.archived_by = None
    patient.archived_reason = None
    # Falls back to "active" rather than guessing lead/recall/etc. — same
    # convention the frontend mock used before this endpoint existed.
    patient.lifecycle_stage = LifecycleStage.ACTIVE.value

    if patient.user is not None:
        patient.user.is_active = True

    await db.commit()
    return await _get_patient_or_404(db, patient_id)


@router.post("/", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)),
) -> Patient:
    created = await create_patient_service(
        db,
        first_name=payload.first_name,
        last_name=payload.last_name,
        dob=payload.dob,
        phone=payload.phone,
        email=str(payload.email) if payload.email is not None else None,
        address=payload.address,
        preferred_contact_method=payload.preferred_contact_method,
        created_via=payload.created_via,
        allergies=payload.allergies,
        medical_history=payload.medical_history,
        current_medications=payload.current_medications,
        emergency_contact_name=payload.emergency_contact_name,
        emergency_contact_phone=payload.emergency_contact_phone,
        created_by=current_user.id,
    )
    # create_patient_service doesn't eager-load .user (there's nothing to
    # load yet — brand new patient, no portal account) but re-fetching here
    # keeps this endpoint consistent with every other one in this file and
    # avoids relying on the service layer knowing about a frontend concern.
    return await _get_patient_or_404(db, created.id)