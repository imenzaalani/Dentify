from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr

from pydantic import BaseModel, ConfigDict, Field


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_number: str
    first_name: str
    last_name: str
    dob: str
    phone: str | None
    email: str | None
    address: str | None
    user_id: uuid.UUID | None
    portal_status: str
    avatar_url: str | None
    primary_contact_user_id: uuid.UUID | None
    preferred_contact_method: str | None
    lifecycle_stage: str
    created_via: str
    no_show_count: int
    allergies: list[str] | None
    medical_history: str | None
    current_medications: str | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    archived_at: datetime | None
    archived_by: uuid.UUID | None
    archived_reason: str | None
    created_by: uuid.UUID | None
    updated_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class NextAppointmentOut(BaseModel):
    date: str  # ISO date, e.g. "2026-07-10"
    time: str  # "HH:MM"
    practitioner: str
    type: str
    status: str  # "confirmed" | "pending"


class PatientDashboardOut(BaseModel):
    # treatment/notifications have no backing tables yet (see api/v1/__init__.py
    # "next slices" note) — always null/empty until those slices exist, rather
    # than faking data the frontend would treat as real.
    nextAppointment: NextAppointmentOut | None
    treatment: None
    notifications: list = []


class PatientSelfOut(BaseModel):
    """Patient-editable subset of their own record — the contact/medical
    fields the patient portal profile page needs. Deliberately excludes
    identity fields (name/email) which live on User and go through
    /auth/me instead, and excludes staff-only fields (patient_number,
    lifecycle_stage, archival, etc.)."""

    model_config = ConfigDict(from_attributes=True)

    address: str | None
    preferred_contact_method: str | None
    allergies: list[str] | None
    medical_history: str | None
    current_medications: str | None


class PatientSelfUpdateRequest(BaseModel):
    address: str | None = Field(None, max_length=500)
    preferred_contact_method: str | None = Field(None, max_length=20)
    allergies: list[str] | None = None
    medical_history: str | None = Field(None, max_length=4000)
    current_medications: str | None = Field(None, max_length=2000)

    model_config = ConfigDict(extra="forbid")


class PatientArchiveRequest(BaseModel):
    reason: str | None = Field(None, max_length=255)


class PatientUpdateRequest(BaseModel):
    # Identity/contact fields — any staff (receptionist/dentist/owner) can write these.
    first_name: str | None = Field(None, min_length=1, max_length=255)
    last_name: str | None = Field(None, min_length=1, max_length=255)
    dob: str | None = Field(None, min_length=1, max_length=50)
    phone: str | None = Field(None, max_length=50)
    email: EmailStr | None = None
    address: str | None = Field(None, max_length=500)
    legal_sex: str | None = Field(None, max_length=50)
    zip_code: str | None = Field(None, max_length=30)
    preferred_contact_method: str | None = Field(None, max_length=20)
    emergency_contact_name: str | None = Field(None, max_length=255)
    emergency_contact_phone: str | None = Field(None, max_length=50)

    # Clinical fields — dentist/owner only (CLINICAL_WRITE in permissions.py).
    allergies: list[str] | None = None
    medical_history: str | None = Field(None, max_length=4000)
    current_medications: str | None = Field(None, max_length=2000)

    model_config = ConfigDict(extra="forbid")


# Fields above that require CLINICAL_WRITE — checked in the router since
# Pydantic alone can't gate by role.
CLINICAL_UPDATE_FIELDS = {"allergies", "medical_history", "current_medications"}


class PatientCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=255)
    last_name: str = Field(..., min_length=1, max_length=255)
    dob: str = Field(..., min_length=1, max_length=50)
    phone: str | None = Field(None, max_length=50)
    email: EmailStr | None = Field(None, max_length=255)
    address: str | None = Field(None, max_length=500)
    preferred_contact_method: str | None = Field(None, max_length=20)
    created_via: str = Field(default="online_form", max_length=50)
    allergies: list[str] | None = None
    medical_history: str | None = Field(None, max_length=4000)
    current_medications: str | None = Field(None, max_length=2000)
    emergency_contact_name: str | None = Field(None, max_length=255)
    emergency_contact_phone: str | None = Field(None, max_length=50)