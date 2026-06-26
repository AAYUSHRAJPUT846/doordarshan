from __future__ import annotations

import logging

from fastapi import WebSocket

from app.ws.connection_manager import ConnectedParticipant, manager
from app.ws.exceptions import GracefulDisconnect, TargetNotFoundError
from app.ws.heartbeat import heartbeat_manager
from app.ws.messages import (
    AnswerMessage,
    AnswerRelayMessage,
    BaseMessage,
    DirectMessage,
    DirectMessageRelay,
    ICECandidateMessage,
    ICECandidateRelayMessage,
    LeaveMessage,
    OfferMessage,
    OfferRelayMessage,
    PingMessage,
    PongAckMessage,
    PongMessage,
)
from app.ws.utils import send_json

logger = logging.getLogger(__name__)


async def handle_ping(
    websocket: WebSocket,
    _: ConnectedParticipant,
) -> None:
    await send_json(websocket, PongMessage())


async def handle_pong(
    websocket: WebSocket,
    _: ConnectedParticipant,
) -> None:
    heartbeat_manager.on_pong(websocket)


async def handle_leave(
    _: WebSocket,
    __: ConnectedParticipant,
) -> None:
    raise GracefulDisconnect


async def handle_offer(
    _: WebSocket,
    participant: ConnectedParticipant,
    message: OfferMessage,
) -> None:
    if not await manager.send_to(
        participant.room_code,
        message.target_user_id,
        OfferRelayMessage(
            from_user_id=participant.user_id,
            sdp=message.sdp,
        ),
    ):
        raise TargetNotFoundError(f"User {message.target_user_id} is not connected")


async def handle_answer(
    _: WebSocket,
    participant: ConnectedParticipant,
    message: AnswerMessage,
) -> None:
    if not await manager.send_to(
        participant.room_code,
        message.target_user_id,
        AnswerRelayMessage(
            from_user_id=participant.user_id,
            sdp=message.sdp,
        ),
    ):
        raise TargetNotFoundError(f"User {message.target_user_id} is not connected")


async def handle_ice_candidate(
    _: WebSocket,
    participant: ConnectedParticipant,
    message: ICECandidateMessage,
) -> None:
    if not await manager.send_to(
        participant.room_code,
        message.target_user_id,
        ICECandidateRelayMessage(
            from_user_id=participant.user_id,
            candidate=message.candidate,
        ),
    ):
        raise TargetNotFoundError(f"User {message.target_user_id} is not connected")


async def handle_direct_message(
    _: WebSocket,
    participant: ConnectedParticipant,
    message: DirectMessage,
) -> None:
    if not await manager.send_to(
        participant.room_code,
        message.target_user_id,
        DirectMessageRelay(
            from_user_id=participant.user_id,
            content=message.content,
        ),
    ):
        raise TargetNotFoundError(f"User {message.target_user_id} is not connected")


async def dispatch_message(
    websocket: WebSocket,
    participant: ConnectedParticipant,
    message: BaseMessage,
) -> None:
    match message:
        case PingMessage():
            await handle_ping(websocket, participant)

        case PongAckMessage():
            await handle_pong(websocket, participant)

        case LeaveMessage():
            await handle_leave(websocket, participant)

        case OfferMessage():
            await handle_offer(websocket, participant, message)

        case AnswerMessage():
            await handle_answer(websocket, participant, message)

        case ICECandidateMessage():
            await handle_ice_candidate(
                websocket,
                participant,
                message,
            )

        case DirectMessage():
            await handle_direct_message(
                websocket,
                participant,
                message,
            )

        case _:
            logger.warning(
                "Unhandled websocket message: %s",
                type(message).__name__,
            )
