HEARTBEAT_INTERVAL: int = 30  # Seconds between server-sent pings
HEARTBEAT_TIMEOUT: int = 10  # Seconds to wait for pong before disconnect

MAX_MESSAGE_SIZE: int = 65_536  # 64 KB per message

WS_CLOSE_NORMAL: int = 1000  # Graceful shutdown
WS_CLOSE_GOING_AWAY: int = 1001  # Server restarting / tab closed
WS_CLOSE_PROTOCOL_ERROR: int = 1002  # Protocol violation
WS_CLOSE_UNSUPPORTED_DATA: int = 1003  # Cannot process message type
WS_CLOSE_POLICY_VIOLATION: int = 1008  # Auth failure / policy breach
WS_CLOSE_MESSAGE_TOO_BIG: int = 1009  # Message exceeds size limit
WS_CLOSE_INTERNAL_ERROR: int = 1011  # Unexpected server error
