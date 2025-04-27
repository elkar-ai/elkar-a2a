from abc import ABC, abstractmethod
import asyncio
from dataclasses import dataclass
import functools
from datetime import datetime

from typing import (
    AsyncIterable,
    Awaitable,
    Callable,
    Protocol,
)

from a2a_types import Task


from a2a_types import *
from store.base import StoredTask, TaskManagerStore


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
    ) -> AsyncIterable[SendTaskResponse] | JSONRPCResponse: ...


class TaskManagerWithStore[T: TaskManagerStore](TaskManager):
    def __init__(self, store: T, agent_card: AgentCard):
        self.store = store
        self.agent_card = agent_card
        self._send_task_handler: Callable[[TaskSendParams], Awaitable[Task]] | None = (
            None
        )

        self._send_task_streaming_handler: (
            Callable[[TaskSendParams], AsyncIterable[SendTaskStreamingResponse]] | None
        ) = None

    async def get_agent_card(self) -> AgentCard:
        return self.agent_card

    async def get_task(
        self, request: GetTaskRequest, request_context: RequestContext | None = None
    ) -> GetTaskResponse:
        stored_task = await self.store.get_task(request.params.id)
        if (
            request_context is not None
            and stored_task.caller_id != request_context.caller_id
        ):
            return GetTaskResponse(
                result=None,
                error=JSONRPCError(code=-32003, message="Task not found", data=None),
            )
        return GetTaskResponse(result=stored_task.task)

    async def cancel_task(
        self, request: CancelTaskRequest, request_context: RequestContext | None = None
    ) -> CancelTaskResponse:
        if request_context is not None:
            stored_task = await self.store.get_task(request.params.id)
            if stored_task.caller_id != request_context.caller_id:
                return CancelTaskResponse(
                    result=None,
                    error=JSONRPCError(
                        code=-32003, message="Task not found", data=None
                    ),
                )
        caller_id = request_context.caller_id if request_context is not None else None
        await self.store.update_task(
            request.params.id,
            StoredTask(
                id=request.params.id,
                caller_id=caller_id,
                status=TaskState.CANCELED,
                push_notification=None,
                task=Task(
                    id=request.params.id,
                    status=TaskStatus(
                        state=TaskState.CANCELED, message=None, timestamp=datetime.now()
                    ),
                ),
            ),
        )
        return CancelTaskResponse()

    async def send_task(
        self, request: SendTaskRequest, request_context: RequestContext | None = None
    ) -> SendTaskResponse:
        if self._send_task_handler is None:
            raise ValueError("send_task_handler is not set")
        params = request.params
        task = Task(
            id=params.id,
            sessionId=params.sessionId,
            status=TaskStatus(
                state=TaskState.SUBMITTED,
                message=None,
                timestamp=datetime.now(),
            ),
            metadata=params.metadata,
            artifacts=None,
            history=None,
        )
        await self.store.create_task(
            StoredTask(
                id=task.id,
                caller_id=(
                    request_context.caller_id if request_context is not None else None
                ),
                status=TaskState.SUBMITTED,
                push_notification=None,
                task=task,
            )
        )
        task_response = await self._send_task_handler(params)
        await self.store.update_task(
            task.id,
            StoredTask(
                id=task.id,
                caller_id=(
                    request_context.caller_id if request_context is not None else None
                ),
                status=task_response.status.state,
                push_notification=None,
                task=task_response,
            ),
        )
        return SendTaskResponse(
            jsonrpc="2.0",
            id=None,
            result=task_response,
            error=None,
        )

    def send_task_handler(self):
        """Decorator to handle common logic for sending tasks, like storing."""

        def decorator(
            fn: Callable[[TaskSendParams], Awaitable[Task]],
        ) -> Callable[[TaskSendParams], Awaitable[Task]]:
            self._send_task_handler = fn
            return fn

        return decorator

    def send_task_streaming_handler(self):
        """Decorator to handle common logic for sending tasks, like streaming."""

        def decorator(
            fn: Callable[[TaskSendParams], AsyncIterable[SendTaskStreamingResponse]],
        ) -> Callable[[TaskSendParams], AsyncIterable[SendTaskStreamingResponse]]:
            self._send_task_streaming_handler = fn
            return fn

        return decorator

    async def _send_task_streaming(
        self,
        request: SendTaskStreamingRequest,
        request_context: RequestContext | None = None,
    ) -> AsyncIterable[SendTaskStreamingResponse] | JSONRPCResponse:
        """
        The protocol defines this method to return an AsyncIterable.
        We implement it as an async iterator function that yields responses.
        """
        caller_id = request_context.caller_id if request_context is not None else None
        task_input = StoredTask(
            id=request.params.id,
            caller_id=caller_id,
            status=TaskState.SUBMITTED,
            push_notification=None,
            task=Task(
                id=request.params.id,
                status=TaskStatus(
                    state=TaskState.SUBMITTED, message=None, timestamp=datetime.now()
                ),
            ),
        )
        if self._send_task_streaming_handler is None:
            raise ValueError("send_task_streaming_handler is not set")

        # Convert the awaitable AsyncIterable to an actual AsyncIterable
        task = await self.store.create_task(task_input)
        task_send_params = request.params
        async for response in self._send_task_streaming_handler(task_send_params):
            if isinstance(response.result, TaskStatusUpdateEvent):
                task.task.status = response.result.status
                task.status = response.result.status.state
                task = await self.store.update_task(
                    task.id,
                    StoredTask(
                        id=task.id,
                        caller_id=caller_id,
                        status=response.result.status.state,
                        push_notification=task.push_notification,
                        task=task.task,
                    ),
                )
            elif isinstance(response.result, TaskArtifactUpdateEvent):
                if task.task.artifacts is None:
                    task.task.artifacts = []
                task.task.artifacts.append(response.result.artifact)
                task = await self.store.update_task(
                    task.id,
                    StoredTask(
                        id=task.id,
                        caller_id=task.caller_id,
                        status=task.status,
                        push_notification=task.push_notification,
                        task=task.task,
                    ),
                )

            yield response
        yield JSONRPCResponse(
            jsonrpc="2.0",
            id=None,
            result=None,
            error=None,
        )

    async def send_task_streaming(
        self,
        request: SendTaskStreamingRequest,
        request_context: RequestContext | None = None,
    ) -> AsyncIterable[SendTaskStreamingResponse] | JSONRPCResponse:
        return self._send_task_streaming(request, request_context)

    async def set_task_push_notification(
        self,
        request: SetTaskPushNotificationRequest,
        request_context: RequestContext | None = None,
    ) -> SetTaskPushNotificationResponse:
        task_id = request.params.id
        task = await self.store.get_task(task_id)
        task.push_notification = request.params.pushNotificationConfig
        task = await self.store.update_task(task_id, task)
        if task.push_notification is None:
            return SetTaskPushNotificationResponse(
                result=None,
                error=JSONRPCError(
                    code=-32003,
                    message="Push Notification is not supported",
                    data=None,
                ),
            )
        return SetTaskPushNotificationResponse(
            result=TaskPushNotificationConfig(
                id=task_id,
                pushNotificationConfig=task.push_notification,
            ),
        )

    async def get_task_push_notification(
        self,
        request: GetTaskPushNotificationRequest,
        request_context: RequestContext | None = None,
    ) -> GetTaskPushNotificationResponse:
        task_id = request.params.id
        task = await self.store.get_task(task_id)
        if task.push_notification is None:
            return GetTaskPushNotificationResponse(
                result=None,
            )
        return GetTaskPushNotificationResponse(
            result=TaskPushNotificationConfig(
                id=task_id,
                pushNotificationConfig=task.push_notification,
            ),
        )

    async def resubscribe_to_task(
        self,
        request: TaskResubscriptionRequest,
        request_context: RequestContext | None = None,
    ) -> AsyncIterable[SendTaskResponse] | JSONRPCResponse:
        raise NotImplementedError("resubscribe_to_task is not implemented")
