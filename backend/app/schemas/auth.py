import uuid
from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    # Which portal the request came from. When set, the account's role must
    # match the portal (patient vs. staff) or login is rejected — this is
    # the server-side enforcement of what used to be a client-only check.
    # Optional/omittable for backwards compatibility.
    portal: Literal["patient", "staff"] | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    phone: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    role: str
    is_active: bool
    is_verified: bool = False
    avatar_url: str | None = None
    created_at: str | None = None

    @field_validator("created_at", mode="before")
    @classmethod
    def serialize_created_at(cls, value: object) -> str | None:
        if isinstance(value, datetime):
            return value.isoformat()
        return value


class WorkingHourEntry(BaseModel):
    day: str
    start: str | None = None
    end: str | None = None
    off: bool = False


class DentistProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    specialty: str
    license_number: str
    bio: str | None = None
    color: str
    working_hours: list[WorkingHourEntry]


class StaffRole(str, Enum):
    RECEPTIONIST = "receptionist"
    DENTIST = "dentist"
    OWNER = "owner"


class StaffCreateRequest(BaseModel):
    email: EmailStr
    phone: str | None = None
    first_name: str = Field(..., min_length=1, max_length=255)
    last_name: str = Field(..., min_length=1, max_length=255)
    role: StaffRole
    specialty: str | None = None
    license_number: str | None = None
    bio: str | None = None
    color: str | None = None
    working_hours: list[WorkingHourEntry] | None = None

    @model_validator(mode="after")
    def check_dentist_fields(self):
        if self.role == StaffRole.DENTIST:
            missing = [field for field in ("specialty", "license_number", "working_hours") if getattr(self, field) is None]
            if missing:
                raise ValueError(f"Missing required dentist fields: {', '.join(missing)}")
        return self


class StaffOut(UserOut):
    dentist_profile: DentistProfileOut | None = None


class StaffUpdateRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    specialty: str | None = None
    license_number: str | None = None
    bio: str | None = None
    color: str | None = None
    working_hours: list[WorkingHourEntry] | None = None


class MeUpdateRequest(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None
    first_name: str | None = None
    last_name: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    # Which portal the request came from. When set, the account's role must
    # match the portal (patient vs. staff) or no email is sent — this stops
    # a patient's email from triggering a reset link via the staff portal
    # (and vice versa). Optional/omittable for backwards compatibility.
    portal: Literal["patient", "staff"] | None = None


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)