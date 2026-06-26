from __future__ import annotations

import json
from typing import TypeAlias

from pydantic import ValidationError

from app.ws.constants import MAX_MESSAGE_SIZE
from app.ws.enums import MessageType
from app.ws.exceptions import MessageValidationError
from app.ws.messages import (
    AnswerMessage,
    DirectMessage,
    ICECandidateMessage,
    LeaveMessage,
    OfferMessage,
    PingMessage,
    PongAckMessage,
)

Message: TypeAlias = (
    PingMessage
    | PongAckMessage
    | LeaveMessage
    | OfferMessage
    | AnswerMessage
    | ICECandidateMessage
    | DirectMessage
)

_PARSERS: dict[str, type[Message]] = {
    MessageType.PING: PingMessage,
    MessageType.PONG: PongAckMessage,
    MessageType.LEAVE: LeaveMessage,
    MessageType.OFFER: OfferMessage,
    MessageType.ANSWER: AnswerMessage,
    MessageType.ICE_CANDIDATE: ICECandidateMessage,
    MessageType.DIRECT_MESSAGE: DirectMessage,
}


def parse_message(raw: str) -> Message:
    if len(raw.encode("utf-8")) > MAX_MESSAGE_SIZE:
        raise MessageValidationError(
            f"Message exceeds the {MAX_MESSAGE_SIZE // 1024} KB size limit"
        )

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise MessageValidationError("Message is not valid JSON") from exc

    if not isinstance(payload, dict):
        raise MessageValidationError("Message must be a JSON object")

    message_type = payload.get("type")
    if message_type is None:
        raise MessageValidationError("Missing required field: 'type'")

    parser = _PARSERS.get(str(message_type))
    if parser is None:
        raise MessageValidationError(f"Unsupported message type: '{message_type}'")

    try:
        return parser.model_validate(payload)
    except ValidationError as exc:
        error = exc.errors()[0]
        field = ".".join(map(str, error["loc"]))
        raise MessageValidationError(
            f"Invalid field '{field}': {error['msg']}"
        ) from exc
