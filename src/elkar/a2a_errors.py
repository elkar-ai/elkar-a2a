from typing import Any

from elkar.json_rpc import JSONRPCError


class TaskNotFoundError(JSONRPCError):
    code: int = -32001
    message: str = "Task not found"
    data: None = None


class TaskNotCancelableError(JSONRPCError):
    code: int = -32002
    message: str = "Task cannot be canceled"
    data: None = None


class PushNotificationNotSupportedError(JSONRPCError):
    code: int = -32003
    message: str = "Push Notification is not supported"
    data: None = None


class UnsupportedOperationError(JSONRPCError):
    code: int = -32004
    message: str = "This operation is not supported"
    data: None = None


class ContentTypeNotSupportedError(JSONRPCError):
    code: int = -32005
    message: str = "Incompatible content types"
    data: None = None


class StreamingNotSupportedError(JSONRPCError):
    code: int = -32006
    message: str = "Streaming is not supported"
    data: None = None


class AuthenticationRequiredError(JSONRPCError):
    code: int = -32007
    message: str = "Authentication required"
    data: None = None


class AuthorizationFailedError(JSONRPCError):
    code: int = -32008
    message: str = "Authorization failed"
    data: None = None


class InvalidTaskStateError(JSONRPCError):
    code: int = -32009
    message: str = "Invalid task state for operation"
    data: None = None


class RateLimitExceededError(JSONRPCError):
    code: int = -32010
    message: str = "Rate limit exceeded"
    data: None = None


class ResourceUnavailableError(JSONRPCError):
    code: int = -32011
    message: str = "Resource unavailable"
    data: None = None


class JSONParseError(JSONRPCError):
    code: int = -32700
    message: str = "Invalid JSON payload"
    data: Any | None = None


class InvalidRequestError(JSONRPCError):
    code: int = -32600
    message: str = "Request payload validation error"
    data: Any | None = None


class MethodNotFoundError(JSONRPCError):
    code: int = -32601
    message: str = "Method not found"
    data: None = None


class InvalidParamsError(JSONRPCError):
    code: int = -32602
    message: str = "Invalid parameters"
    data: Any | None = None


class InternalError(JSONRPCError):
    code: int = -32603
    message: str = "Internal error"
    data: Any | None = None
