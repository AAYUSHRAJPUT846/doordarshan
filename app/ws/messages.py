from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.ws.enums import MessageType


class BaseMessage(BaseModel):
    model_config = {"extra": "ignore"}


class PingMessage(BaseMessage):
    type: Literal[MessageType.PING] = MessageType.PING


class PongAckMessage(BaseMessage):
    type: Literal[MessageType.PONG] = MessageType.PONG


class LeaveMessage(BaseMessage):
    type: Literal[MessageType.LEAVE] = MessageType.LEAVE


class OfferMessage(BaseMessage):
    type: Literal[MessageType.OFFER] = MessageType.OFFER
    target_user_id: int
    sdp: str


class AnswerMessage(BaseMessage):
    type: Literal[MessageType.ANSWER] = MessageType.ANSWER
    target_user_id: int
    sdp: str


class ICECandidateMessage(BaseMessage):
    type: Literal[MessageType.ICE_CANDIDATE] = MessageType.ICE_CANDIDATE
    target_user_id: int
    candidate: dict[str, Any]


class DirectMessage(BaseMessage):
    type: Literal[MessageType.DIRECT_MESSAGE] = MessageType.DIRECT_MESSAGE
    target_user_id: int
    content: str = Field(max_length=4096)


class ServerPingMessage(BaseMessage):
    type: Literal[MessageType.PING] = MessageType.PING


class PongMessage(BaseMessage):
    type: Literal[MessageType.PONG] = MessageType.PONG


class ParticipantInfo(BaseMessage):
    user_id: int
    username: str


class ParticipantJoinedMessage(BaseMessage):
    type: Literal[MessageType.PARTICIPANT_JOINED] = MessageType.PARTICIPANT_JOINED
    user_id: int
    username: str


class ParticipantLeftMessage(BaseMessage):
    type: Literal[MessageType.PARTICIPANT_LEFT] = MessageType.PARTICIPANT_LEFT
    user_id: int
    username: str


class ParticipantListMessage(BaseMessage):
    type: Literal[MessageType.PARTICIPANT_LIST] = MessageType.PARTICIPANT_LIST
    participants: list[ParticipantInfo]


class OfferRelayMessage(BaseMessage):
    type: Literal[MessageType.OFFER] = MessageType.OFFER
    from_user_id: int
    sdp: str


class AnswerRelayMessage(BaseMessage):
    type: Literal[MessageType.ANSWER] = MessageType.ANSWER
    from_user_id: int
    sdp: str


class ICECandidateRelayMessage(BaseMessage):
    type: Literal[MessageType.ICE_CANDIDATE] = MessageType.ICE_CANDIDATE
    from_user_id: int
    candidate: dict[str, Any]


class DirectMessageRelay(BaseMessage):
    type: Literal[MessageType.DIRECT_MESSAGE] = MessageType.DIRECT_MESSAGE
    from_user_id: int
    content: str


class ErrorMessage(BaseMessage):
    type: Literal[MessageType.ERROR] = MessageType.ERROR
    code: str
    message: str
