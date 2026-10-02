from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.lead import Lead
from app.schemas.lead import LeadCreateRequest, LeadOut

from app.schemas.lead import LeadUpdateRequest

from app.core.deps import require_roles
from app.core.permissions import Role
from app.models.patient import Patient
from app.models.user import User
from app.schemas.lead import LeadConvertResponse

router = APIRouter(prefix="/leads", tags=["leads"])


@router.get("/", response_model=list[LeadOut])
async def list_leads(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)),
) -> list[Lead]:
    result = await db.execute(select(Lead).order_by(Lead.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
async def create_lead(payload: LeadCreateRequest, db: AsyncSession = Depends(get_db)) -> Lead:
    lead = Lead(
        requested_service=payload.requested_service,
        requested_datetime=payload.requested_datetime,
        booking_for=payload.booking_for.value,
        patient_first_name=payload.patient_first_name,
        patient_last_name=payload.patient_last_name,
        patient_legal_sex=payload.patient_legal_sex,
        patient_dob=payload.patient_dob,
        patient_zip=payload.patient_zip,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        sms_consent=payload.sms_consent,
        comments=payload.comments,
        hear_about_us=payload.hear_about_us.value if payload.hear_about_us else None,
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.patch("/{lead_id}", response_model=LeadOut)
async def update_lead(
    lead_id: UUID,
    payload: LeadUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)),
) -> Lead:
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if payload.status is not None:
        if payload.status.value == "converted":
            raise HTTPException(
                status_code=400,
                detail="Use POST /leads/{lead_id}/convert to convert a lead — it creates the patient record too.",
            )
        lead.status = payload.status.value
    if payload.notes is not None:
        lead.notes = payload.notes

    await db.commit()
    await db.refresh(lead)
    return lead


from app.services.patients import create_patient as create_patient_service

@router.post(
    "/{lead_id}/convert",
    response_model=LeadConvertResponse,
    status_code=status.HTTP_201_CREATED,
)
async def convert_lead(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.RECEPTIONIST, Role.DENTIST, Role.OWNER)),
) -> LeadConvertResponse:
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if lead.status == "converted":
        raise HTTPException(status_code=409, detail="Lead has already been converted")

    patient = await create_patient_service(
        db,
        first_name=lead.patient_first_name,
        last_name=lead.patient_last_name,
        dob=lead.patient_dob,
        legal_sex=lead.patient_legal_sex,
        zip_code=lead.patient_zip,
        # Only wire up direct contact info when the booker IS the patient.
        # For "dependent"/"someone_else", contact_* belongs to whoever
        # called in, not necessarily to this patient.
        phone=lead.contact_phone if lead.booking_for == "myself" else None,
        email=lead.contact_email if lead.booking_for == "myself" else None,
        created_via=lead.source,
        created_by=current_user.id,
        updated_by=current_user.id,
        # user_id / primary_contact_user_id intentionally left unset —
        # resolved later only if/when a portal invite happens.
        # address / allergies / medical_history / emergency contact / preferred
        # contact method: leads never collect these → stay None, same as any
        # other patient created without that data.
    )

    lead.status = "converted"
    lead.converted_to_patient_id = patient.id

    await db.commit()
    await db.refresh(lead)

    return LeadConvertResponse(lead=lead, patient=patient)