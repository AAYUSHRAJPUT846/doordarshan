from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RecordingCreate(BaseModel):
    meeting_id: int = Field(
        ...,
        gt=0,
        description="ID of the meeting associated with the recording.",
    )
    file_url: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="URL where the recording file is stored.",
        examples=[
            "https://example.com/recordings/meeting-123.mp4",
        ],
    )
    duration_seconds: int | None = Field(
        default=None,
        ge=0,
        description="Optional recording duration in seconds.",
    )


class RecordingResponse(BaseModel):
    id: int
    meeting_id: int
    creator_id: int
    file_url: str
    duration_seconds: int | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
