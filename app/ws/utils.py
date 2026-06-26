from __future__ import annotations

import logging

from fastapi import WebSocket

from app.ws.messages import BaseMessage

logger = logging.getLogger(__name__)


async def send_json(
    websocket: WebSocket,
    message: BaseMessage,
) -> bool:

    try:
        await websocket.send_json(message.model_dump(mode="json"))
        return True
    except Exception:
        logger.exception("Failed to send websocket message")
        return False
