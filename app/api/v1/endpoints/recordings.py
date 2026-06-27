from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status

from app.api.dependencies import CurrentUser, DBSession
from app.crud.crud_meeting import get_meeting_by_id
from app.crud.crud_recording import (
    create_recording,
    delete_recording,
    get_recording_by_id,
    get_recordings,
)
from app.models.recording import Recording
from app.schemas.recording import RecordingCreate, RecordingResponse

router = APIRouter(
    prefix="/recordings",
    tags=["Recordings"],
)

RecordingID = Annotated[
    int,
    Path(
        gt=0,
        description="Recording ID",
    ),
]


def get_recording_or_404(
    db: DBSession,
    recording_id: RecordingID,
) -> Recording:
    recording = get_recording_by_id(
        db=db,
        recording_id=recording_id,
    )

    if recording is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found.",
        )

    return recording


def verify_creator(
    recording: Recording,
    current_user: CurrentUser,
) -> None:
    if recording.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator can perform this action.",
        )


@router.post(
    "",
    response_model=RecordingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a recording",
)
def create_recording_endpoint(
    recording_data: RecordingCreate,
    db: DBSession,
    current_user: CurrentUser,
) -> Recording:
    meeting = get_meeting_by_id(
        db=db,
        meeting_id=recording_data.meeting_id,
    )

    if meeting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found.",
        )

    return create_recording(
        db=db,
        recording=recording_data,
        creator_id=current_user.id,
    )


@router.get(
    "",
    response_model=list[RecordingResponse],
    summary="List recordings",
)
def list_recordings(
    db: DBSession,
) -> list[Recording]:
    return get_recordings(
        db=db,
    )


@router.get(
    "/{recording_id}",
    response_model=RecordingResponse,
    summary="Get a recording",
)
def get_recording_endpoint(
    recording_id: RecordingID,
    db: DBSession,
) -> Recording:
    return get_recording_or_404(
        db=db,
        recording_id=recording_id,
    )


@router.delete(
    "/{recording_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a recording",
)
def delete_recording_endpoint(
    recording_id: RecordingID,
    db: DBSession,
    current_user: CurrentUser,
) -> None:
    recording = get_recording_or_404(
        db=db,
        recording_id=recording_id,
    )

    verify_creator(
        recording=recording,
        current_user=current_user,
    )

    delete_recording(
        db=db,
        recording=recording,
    )
