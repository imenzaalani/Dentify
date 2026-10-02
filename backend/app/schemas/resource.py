from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    type: str
    active: bool
    created_at: datetime
    updated_at: datetime


class ResourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., max_length=20)


class ResourceUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    type: str | None = Field(None, max_length=20)
    active: bool | None = None

    model_config = ConfigDict(extra="forbid")