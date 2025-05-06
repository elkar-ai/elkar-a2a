from abc import abstractmethod
from dataclasses import dataclass
from typing import Any, AsyncIterable, Protocol
from elkar.a2a_types import (
    AgentCard,
    CancelTaskRequest,
    SendTaskRequest,
    SendTaskResponse,
    GetTaskRequest,
    GetTaskResponse,
    CancelTaskResponse,
    SendTaskStreamingRequest,
    SendTaskStreamingResponse,
    SetTaskPushNotificationRequest,
    SetTaskPushNotificationResponse,
    GetTaskPushNotificationRequest,
    GetTaskPushNotificationResponse,
    TaskResubscriptionRequest,
    JSONRPCResponse,
)


@dataclass
class RequestContext:
    caller_id: str | None
    metadata: dict[str, Any]


class TaskManager(Protocol):
    @abstractmethod
    async def get_agent_card(self) -> AgentCard: ...

    @abstractmethod
    async def send_task(
        self, request: SendTaskRequest, request_context: RequestContext | None = None
    ) -> SendTaskResponse: ...

    @abstractmethod
    async def get_task(
        self, request: GetTaskRequest, request_context: RequestContext | None = None
    ) -> GetTaskResponse: ...

    @abstractmethod
    async def cancel_task(
        self, request: CancelTaskRequest, request_context: RequestContext | None = None
    ) -> CancelTaskResponse: ...

    @abstractmethod
    async def send_task_streaming(
        self,
        request: SendTaskStreamingRequest,
        request_context: RequestContext | None = None,
    ) -> AsyncIterable[SendTaskStreamingResponse] | JSONRPCResponse: ...

    @abstractmethod
    async def set_task_push_notification(
        self,
        request: SetTaskPushNotificationRequest,
        request_context: RequestContext | None = None,
    ) -> SetTaskPushNotificationResponse: ...

    @abstractmethod
    async def get_task_push_notification(
        self,
        request: GetTaskPushNotificationRequest,
        request_context: RequestContext | None = None,
    ) -> GetTaskPushNotificationResponse: ...

    @abstractmethod
    async def resubscribe_to_task(
        self,
        request: TaskResubscriptionRequest,
        request_context: RequestContext | None = None,
    ) -> AsyncIterable[SendTaskStreamingResponse] | JSONRPCResponse: ...
