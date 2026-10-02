from __future__ import annotations

import enum
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    dentist_id: uuid.UUID
    care_type_id: uuid.UUID
    treatment_step_id: uuid.UUID | None
    resource_id: uuid.UUID | None
    series_id: uuid.UUID | None
    series_occurrence_index: int | None
    scheduled_at: datetime
    duration_minutes: int
    send_confirmation: bool
    confirmation_delivery_status: str
    confirmation_sent_at: datetime | None
    status: str
    prep_notes: str | None
    internal_notes: str | None
    cancellation_reason: str | None
    cancelled_at: datetime | None
    cancelled_by: uuid.UUID | None
    created_by: uuid.UUID | None
    updated_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class AppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    dentist_id: uuid.UUID
    care_type_id: uuid.UUID
    treatment_step_id: uuid.UUID | None = None
    resource_id: uuid.UUID | None = None
    scheduled_at: datetime
    duration_minutes: int = Field(..., gt=0)
    send_confirmation: bool = True
    prep_notes: str | None = Field(None, max_length=2000)
    internal_notes: str | None = Field(None, max_length=2000)


class AppointmentUpdate(BaseModel):
    # Reschedule/reassign/rebook fields — status changes go through the
    # dedicated action endpoints (confirm/check-in/complete/cancel/
    # no-show), same convention leads.py uses for blocking status="converted".
    patient_id: uuid.UUID | None = None
    dentist_id: uuid.UUID | None = None
    care_type_id: uuid.UUID | None = None
    treatment_step_id: uuid.UUID | None = None
    resource_id: uuid.UUID | None = None
    scheduled_at: datetime | None = None
    duration_minutes: int | None = Field(None, gt=0)
    send_confirmation: bool | None = None
    prep_notes: str | None = Field(None, max_length=2000)
    internal_notes: str | None = Field(None, max_length=2000)

    model_config = ConfigDict(extra="forbid")

class AppointmentCancelRequest(BaseModel):
    reason: str | None = Field(None, max_length=255)

class RecurrenceFrequency(str, enum.Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"


# Cap how many occurrences a single request can generate — protects against
# a mistyped "until" decades out, or count=99999, hammering the DB with one
# request. 104 is 2 years of weekly appointments, generous for a dental
# recall series.
MAX_SERIES_OCCURRENCES = 104


class RecurrenceRule(BaseModel):
    frequency: RecurrenceFrequency
    # Exactly one of the two must be set — validated below. count is
    # 1-indexed and includes the first (already-scheduled) occurrence.
    count: int | None = Field(None, ge=1, le=MAX_SERIES_OCCURRENCES)
    until: date | None = None

    @model_validator(mode="after")
    def _exactly_one_end_condition(self) -> "RecurrenceRule":
        if (self.count is None) == (self.until is None):
            raise ValueError("Set exactly one of 'count' or 'until' to end the series")
        return self


class RecurringAppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    dentist_id: uuid.UUID
    care_type_id: uuid.UUID
    resource_id: uuid.UUID | None = None
    # First occurrence — later ones are derived from this by the recurrence
    # rule, same duration/notes/etc. for every occurrence in the series.
    scheduled_at: datetime
    duration_minutes: int = Field(..., gt=0)
    send_confirmation: bool = True
    prep_notes: str | None = Field(None, max_length=2000)
    internal_notes: str | None = Field(None, max_length=2000)
    recurrence: RecurrenceRule


class AppointmentSeriesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    dentist_id: uuid.UUID
    care_type_id: uuid.UUID
    resource_id: uuid.UUID | None
    frequency: str
    occurrence_count: int | None
    until: date | None
    duration_minutes: int
    send_confirmation: bool
    prep_notes: str | None
    internal_notes: str | None
    created_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class SkippedOccurrence(BaseModel):
    scheduled_at: datetime
    reason: str


class RecurringAppointmentCreateResponse(BaseModel):
    series: AppointmentSeriesOut
    created: list[AppointmentOut]
    # Occurrences the recurrence rule generated but that hit a scheduling
    # conflict (double-booked dentist/chair) and were skipped rather than
    # failing the whole series — the caller decides what to do about them
    # (e.g. offer to reschedule individually, or show a warning).
    skipped: list[SkippedOccurrence]


class SeriesCancelRequest(BaseModel):
    reason: str | None = Field(None, max_length=255)
    # True (default): only cancel occurrences that haven't happened/been
    # resolved yet (pending/confirmed/arrived) — matches "cancel the rest
    # of this series" intent without touching history. False cancels every
    # active occurrence regardless of date, for the rare "actually undo the
    # whole thing" case.
    only_future: bool = True