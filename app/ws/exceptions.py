from app.ws.constants import (
    WS_CLOSE_INTERNAL_ERROR,
    WS_CLOSE_POLICY_VIOLATION,
    WS_CLOSE_UNSUPPORTED_DATA,
)


class WebSocketError(Exception):
    code = WS_CLOSE_INTERNAL_ERROR
    reason = "Internal server error"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.reason)


class AuthenticationError(WebSocketError):
    code = WS_CLOSE_POLICY_VIOLATION
    reason = "Authentication failed"


class RoomNotFoundError(WebSocketError):
    code = WS_CLOSE_POLICY_VIOLATION
    reason = "Room not found"


class RoomInactiveError(WebSocketError):
    code = WS_CLOSE_POLICY_VIOLATION
    reason = "Room is inactive"


class MessageValidationError(WebSocketError):
    code = WS_CLOSE_UNSUPPORTED_DATA
    reason = "Invalid message"


class TargetNotFoundError(WebSocketError):
    code = WS_CLOSE_POLICY_VIOLATION
    reason = "Target participant not found"


class GracefulDisconnect(Exception):
    pass
