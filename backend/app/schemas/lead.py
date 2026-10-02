from __future__ import annotations

from datetime import datetime
from enum import Enum
import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.patient import PatientOut


class BookingFor(str, Enum):
    MYSELF = "myself"
    DEPENDENT = "dependent"
    SOMEONE_ELSE = "someone_else"


class HearAboutUs(str, Enum):
    GOOGLE = "google"
    INSTAGRAM_FACEBOOK = "instagram_facebook"
    YELP = "yelp"
    FAMILY_FRIEND = "family_friend"
    WALK_BY = "walk_by"
    OTHER = "other"


class LeadCreateRequest(BaseModel):
    requested_service: str = Field(..., min_length=1, max_length=255)
    requested_datetime: str = Field(..., min_length=1, max_length=50)

    booking_for: BookingFor

    patient_first_name: str = Field(..., min_length=1, max_length=255)
    patient_last_name: str = Field(..., min_length=1, max_length=255)
    patient_legal_sex: str | None = Field(None, max_length=50)
    patient_dob: str = Field(..., min_length=1, max_length=50)
    patient_zip: str | None = Field(None, max_length=30)

    contact_email: EmailStr
    contact_phone: str = Field(..., min_length=1, max_length=50)
    sms_consent: bool = False

    comments: str | None = Field(None, max_length=2000)
    hear_about_us: HearAboutUs | None = None


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    requested_service: str
    requested_datetime: str
    booking_for: BookingFor
    patient_first_name: str
    patient_last_name: str
    patient_legal_sex: str | None
    patient_dob: str
    patient_zip: str | None
    contact_email: EmailStr
    contact_phone: str
    sms_consent: bool
    comments: str | None
    hear_about_us: HearAboutUs | None
    source: str
    status: str
    notes: str | None
    converted_to_patient_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

class LeadStatus(str, Enum):
    PENDING = "pending"
    CONVERTED = "converted"
    REJECTED = "rejected"
    NO_RESPONSE = "no_response"


class LeadUpdateRequest(BaseModel):
    status: LeadStatus | None = None
    notes: str | None = Field(None, max_length=2000)


class LeadConvertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    lead: LeadOut
    patient: PatientOut