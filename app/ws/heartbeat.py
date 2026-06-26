from __future__ import annotations

import asyncio
import logging

from fastapi import WebSocket

from app.ws.constants import (
    HEARTBEAT_INTERVAL,
    HEARTBEAT_TIMEOUT,
    WS_CLOSE_NORMAL,
)
from app.ws.messages import ServerPingMessage
from app.ws.utils import send_json

logger = logging.getLogger(__name__)


class HeartbeatManager:
    def __init__(self) -> None:
        self._tasks: dict[WebSocket, asyncio.Task[None]] = {}
        self._events: dict[WebSocket, asyncio.Event] = {}

    def start(self, websocket: WebSocket) -> None:
        event = asyncio.Event()
        self._events[websocket] = event
        self._tasks[websocket] = asyncio.create_task(self._loop(websocket, event))

    async def stop(self, websocket: WebSocket) -> None:
        task = self._tasks.pop(websocket, None)
        self._events.pop(websocket, None)

        if task is None or task.done():
            return

        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            pass

    def on_pong(self, websocket: WebSocket) -> None:
        event = self._events.get(websocket)
        if event:
            event.set()

    async def _loop(
        self,
        websocket: WebSocket,
        event: asyncio.Event,
    ) -> None:
        try:
            while True:
                await asyncio.sleep(HEARTBEAT_INTERVAL)

                event.clear()

                if not await send_json(websocket, ServerPingMessage()):
                    break

                try:
                    await asyncio.wait_for(
                        event.wait(),
                        timeout=HEARTBEAT_TIMEOUT,
                    )
                except TimeoutError:
                    try:
                        await websocket.close(
                            code=WS_CLOSE_NORMAL,
                            reason="Heartbeat timeout",
                        )
                    except Exception:
                        pass
                    break

        except asyncio.CancelledError:
            pass

        except Exception:
            logger.exception(
                "Heartbeat loop failed for websocket %s",
                id(websocket),
            )


heartbeat_manager = HeartbeatManager()
