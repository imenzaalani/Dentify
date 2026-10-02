from __future__ import annotations

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import LifecycleStage, Patient


async def _next_patient_number(db: AsyncSession) -> str:
    result = await db.execute(text("SELECT nextval('patients_patient_number_seq')"))
    n = result.scalar_one()
    return f"P-{n:06d}"


async def create_patient(
    db: AsyncSession,
    *,
    first_name: str,
    last_name: str,
    dob: str,
    created_via: str,
    created_by: UUID | None = None,
    updated_by: UUID | None = None,
    phone: str | None = None,
    email: str | None = None,
    address: str | None = None,
    legal_sex: str | None = None,
    zip_code: str | None = None,
    preferred_contact_method: str | None = None,
    lifecycle_stage: str = LifecycleStage.NEW.value,
    allergies: list[str] | None = None,
    medical_history: str | None = None,
    current_medications: str | None = None,
    emergency_contact_name: str | None = None,
    emergency_contact_phone: str | None = None,
    user_id: UUID | None = None,
    primary_contact_user_id: UUID | None = None,
) -> Patient:
    """The single place a Patient row gets created.

    Every entry point (walk-in form, phone intake, lead conversion, import,
    portal self-registration — whatever exists now or later) calls this
    with whatever fields *it* has. Anything it doesn't have is left None,
    which is exactly the intended behavior — not a special case.
    """
    patient = Patient(
        patient_number=await _next_patient_number(db),
        first_name=first_name,
        last_name=last_name,
        dob=dob,
        phone=phone,
        email=email,
        address=address,
        legal_sex=legal_sex,
        zip_code=zip_code,
        preferred_contact_method=preferred_contact_method,
        created_via=created_via,
        lifecycle_stage=lifecycle_stage,
        allergies=allergies,
        medical_history=medical_history,
        current_medications=current_medications,
        emergency_contact_name=emergency_contact_name,
        emergency_contact_phone=emergency_contact_phone,
        user_id=user_id,
        primary_contact_user_id=primary_contact_user_id,
        created_by=created_by,
        updated_by=updated_by,
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient