from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status

from app.api.dependencies import CurrentUser, DBSession
from app.crud.crud_meeting import (
    create_meeting,
    delete_meeting,
    get_meeting_by_id,
    get_meetings,
    update_meeting,
)
from app.models.meeting import Meeting
from app.schemas.meeting import MeetingCreate, MeetingResponse

router = APIRouter(
    prefix="/meetings",
    tags=["Meetings"],
)

MeetingID = Annotated[int, Path(gt=0, description="Meeting ID")]


def get_meeting_or_404(
    db: DBSession,
    meeting_id: MeetingID,
) -> Meeting:
    meeting = get_meeting_by_id(db, meeting_id)

    if meeting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found.",
        )

    return meeting


def verify_host(
    meeting: Meeting,
    current_user: CurrentUser,
) -> None:
    if meeting.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the meeting host can perform this action.",
        )


@router.post(
    "",
    response_model=MeetingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a meeting",
)
def create_meeting_endpoint(
    meeting_data: MeetingCreate,
    db: DBSession,
    current_user: CurrentUser,
) -> Meeting:
    return create_meeting(
        db=db,
        meeting=meeting_data,
        host_id=current_user.id,
    )


@router.get(
    "",
    response_model=list[MeetingResponse],
    summary="List meetings",
)
def list_meetings(
    db: DBSession,
) -> list[Meeting]:
    return get_meetings(db)


@router.get(
    "/{meeting_id}",
    response_model=MeetingResponse,
    summary="Get a meeting",
)
def get_meeting_endpoint(
    meeting_id: MeetingID,
    db: DBSession,
) -> Meeting:
    return get_meeting_or_404(
        db=db,
        meeting_id=meeting_id,
    )


@router.put(
    "/{meeting_id}",
    response_model=MeetingResponse,
    summary="Update a meeting",
)
def update_meeting_endpoint(
    meeting_id: MeetingID,
    meeting_data: MeetingCreate,
    db: DBSession,
    current_user: CurrentUser,
) -> Meeting:
    meeting = get_meeting_or_404(
        db=db,
        meeting_id=meeting_id,
    )

    verify_host(
        meeting=meeting,
        current_user=current_user,
    )

    return update_meeting(
        db=db,
        meeting=meeting,
        meeting_data=meeting_data,
    )


@router.delete(
    "/{meeting_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a meeting",
)
def delete_meeting_endpoint(
    meeting_id: MeetingID,
    db: DBSession,
    current_user: CurrentUser,
) -> None:
    meeting = get_meeting_or_404(
        db=db,
        meeting_id=meeting_id,
    )

    verify_host(
        meeting=meeting,
        current_user=current_user,
    )

    delete_meeting(
        db=db,
        meeting=meeting,
    )
