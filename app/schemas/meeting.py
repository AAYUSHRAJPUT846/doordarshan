from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MeetingBase(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Meeting title.",
    )
    description: str | None = Field(
        default=None,
        max_length=500,
        description="Optional meeting description.",
    )
    room_id: int | None = Field(
        default=None,
        gt=0,
        description="Optional room associated with the meeting.",
    )
    scheduled_at: datetime | None = Field(
        default=None,
        description="Scheduled start time of the meeting.",
    )


class MeetingCreate(MeetingBase):
    """Schema used when creating a meeting."""


class MeetingUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="Meeting title.",
    )
    description: str | None = Field(
        default=None,
        max_length=500,
        description="Optional meeting description.",
    )
    room_id: int | None = Field(
        default=None,
        gt=0,
        description="Optional room associated with the meeting.",
    )
    scheduled_at: datetime | None = Field(
        default=None,
        description="Scheduled start time of the meeting.",
    )
    is_active: bool | None = Field(
        default=None,
        description="Whether the meeting is active.",
    )


class MeetingResponse(MeetingBase):
    id: int
    host_id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
