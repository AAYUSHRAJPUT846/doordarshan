from enum import StrEnum


class MessageType(StrEnum):
    PING = "ping"
    PONG = "pong"

    LEAVE = "leave"

    OFFER = "offer"
    ANSWER = "answer"
    ICE_CANDIDATE = "ice_candidate"

    DIRECT_MESSAGE = "direct_message"

    PARTICIPANT_JOINED = "participant_joined"
    PARTICIPANT_LEFT = "participant_left"
    PARTICIPANT_LIST = "participant_list"

    ERROR = "error"
