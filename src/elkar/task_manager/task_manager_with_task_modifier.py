from abc import abstractmethod
import asyncio
from dataclasses import dataclass
from datetime import datetime

from typing import (
    Any,
    AsyncIterable,
    Awaitable,
    Callable,
    Optional,
)
import uuid

from elkar.a2a_types import (
    AgentCard,
    Artifact,
    InternalError,
    Message,
    Task,
    TaskArtifactUpdateEvent,
    TaskSendParams,
    TaskState,
    TaskStatusUpdateEvent,
    TaskStatus,
    GetTaskRequest,
    GetTaskResponse,
    CancelTaskRequest,
    CancelTaskResponse,
    SendTaskRequest,
    SendTaskResponse,
    SendTaskStreamingRequest,
    SendTaskStreamingResponse,
    SetTaskPushNotificationRequest,
    SetTaskPushNotificationResponse,
    GetTaskPushNotificationRequest,
    GetTaskPushNotificationResponse,
    TaskResubscriptionRequest,
    JSONRPCError,
    JSONRPCResponse,
    TaskNotFoundError,
    PushNotificationNotSupportedError,
    TaskPushNotificationConfig,
    TextPart,
)


from elkar.common import ListTasksRequest, PaginatedResponse
from elkar.store.in_memory import InMemoryTaskManagerStore

from elkar.task_modifier.base import TaskModifierBase
from elkar.task_modifier.task_modifier import TaskModifier
from elkar.task_queue.base import TaskEvent, TaskEventManager
from elkar.store.base import (
    ListTasksParams,
    StoredTask,
    TaskManagerStore,
    UpdateTaskParams,
)
from elkar.task_manager.task_manager_base import RequestContext, TaskManager

import logging

from elkar.task_queue.in_memory import InMemoryTaskEventQueue

logger = logging.getLogger(__name__)


@dataclass
class TaskSendOutput:
    status: TaskStatus | None = None
    new_history_messages: list[Message] | None = None
    new_artifacts: list[Artifact] | None = None
    metadata: dict[str, Any] | None = None


class TaskManagerWithModifier[S: TaskManagerStore, Q: TaskEventManager](TaskManager):
    def __init__(
        self,
        agent_card: AgentCard,
        store: Optional[S] = None,
        queue: Optional[Q] = None,
        send_task_handler: Callable[..., Awaitable[None]] | None = None,
    ):

        self.agent_card = agent_card
        self._send_task_handler = send_task_handler
        self.store: S = store or InMemoryTaskManagerStore()  # type: ignore
        self.queue: Q = queue or InMemoryTaskEventQueue()  # type: ignore

    async def get_agent_card(self) -> AgentCard:
        return self.agent_card

    async def get_task(
        self, request: GetTaskRequest, request_context: RequestContext | None = None
    ) -> GetTaskResponse:
        stored_task = await self.store.get_task(request.params.id)
        if stored_task is None:
            return GetTaskResponse(
                result=None,
                error=TaskNotFoundError(),
            )
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
        stored_task = await self.store.get_task(request.params.id)
        if stored_task is None:
            return CancelTaskResponse(result=None, error=TaskNotFoundError())
        error = self._check_caller_id(stored_task, request_context)
        if error is not None:
            return CancelTaskResponse(
                result=None,
                error=error,
            )
        caller_id = request_context.caller_id if request_context is not None else None
        await self.store.update_task(
            request.params.id,
            UpdateTaskParams(
                status=TaskStatus(
                    state=TaskState.CANCELED,
                    message=None,
                    timestamp=datetime.now(),
                ),
                caller_id=caller_id,
            ),
        )
        return CancelTaskResponse()

    async def _prepare_task_modifier(
        self,
        params: TaskSendParams,
        request_context: RequestContext | None,
        with_queue: bool = False,
        is_streaming: bool = False,
    ) -> TaskModifier[S, Q] | SendTaskResponse:
        if self._send_task_handler is None:
            raise ValueError("send_task_handler is not set")

        stored_task = await self.store.get_task(params.id)
        if (
            stored_task is not None
            and self._check_caller_id(stored_task, request_context) is not None
        ):
            return SendTaskResponse(
                result=None,
                error=TaskNotFoundError(),
            )
        elif stored_task is None:
            stored_task = await self.store.upsert_task(
                params,
                caller_id=(
                    request_context.caller_id if request_context is not None else None
                ),
                is_streaming=is_streaming,
            )
        task_modifier: TaskModifier[S, Q] = TaskModifier(
            task=stored_task.task,
            store=self.store,
            queue=self.queue if with_queue else None,
            caller_id=(
                request_context.caller_id if request_context is not None else None
            ),
        )

        return task_modifier

    async def send_task(
        self, request: SendTaskRequest, request_context: RequestContext | None = None
    ) -> SendTaskResponse:
        if self._send_task_handler is None:
            raise ValueError("send_task_handler is not set")
        params = request.params
        task_modifier = await self._prepare_task_modifier(
            params, request_context, with_queue=False
        )
        if isinstance(task_modifier, SendTaskResponse):
            return task_modifier

        try:
            await self._send_task_handler(task_modifier, request_context)
        except Exception as e:
            await task_modifier.set_status(
                TaskStatus(
                    state=TaskState.FAILED,
                    message=Message(
                        role="agent", parts=[TextPart(text="Internal error")]
                    ),
                    timestamp=datetime.now(),
                ),
            )
            raise e

        stored_task = await self.store.get_task(params.id)
        if stored_task is None:
            return SendTaskResponse(
                result=None,
                error=TaskNotFoundError(),
            )
        return SendTaskResponse(
            jsonrpc="2.0",
            id=None,
            result=stored_task.task,
            error=None,
        )

    async def _send_task_streaming(
        self,
        request: SendTaskStreamingRequest,
        request_context: RequestContext | None = None,
    ) -> None:
        if self._send_task_handler is None:
            raise ValueError("send_task_handler is not set")
        params = request.params
        task_modifier = await self._prepare_task_modifier(
            params, request_context, with_queue=True
        )
        if isinstance(task_modifier, SendTaskResponse):
            raise ValueError("Error while preparing the task")

        try:
            await self._send_task_handler(task_modifier, request_context)
        except Exception as e:
            await task_modifier.set_status(
                TaskStatus(
                    state=TaskState.FAILED,
                    message=Message(
                        role="agent",
                        parts=[TextPart(text="Internal error in the task handler.")],
                    ),
                    timestamp=datetime.now(),
                ),
                is_final=True,
            )
            raise e

    async def send_task_streaming(
        self,
        request: SendTaskStreamingRequest,
        request_context: RequestContext | None = None,
    ) -> AsyncIterable[SendTaskStreamingResponse] | JSONRPCResponse:
        subscriber_identifier = str(uuid.uuid4())
        await self.queue.add_subscriber(
            request.params.id,
            subscriber_identifier,
            is_resubscribe=False,
            caller_id=(
                request_context.caller_id if request_context is not None else None
            ),
        )

        asyncio.create_task(self._send_task_streaming(request, request_context))
        try:
            events = await self.dequeue_task_events(
                request.id,
                request.params.id,
                subscriber_identifier,
            )
            return events
        except Exception as e:
            logger.error(f"Error while sending task streaming: {e}")
            return JSONRPCResponse(
                id=request.id,
                error=InternalError(message="Internal error"),
            )

    async def set_task_push_notification(
        self,
        request: SetTaskPushNotificationRequest,
        request_context: RequestContext | None = None,
    ) -> SetTaskPushNotificationResponse:
        if not self.agent_card.capabilities.pushNotifications:
            return SetTaskPushNotificationResponse(
                result=None, error=PushNotificationNotSupportedError()
            )
        task_id = request.params.id
        task = await self.store.get_task(task_id)
        if task is None:
            return SetTaskPushNotificationResponse(
                result=None,
                error=TaskNotFoundError(),
            )
        error = self._check_caller_id(task, request_context)
        if error is not None:
            return SetTaskPushNotificationResponse(
                result=None,
                error=error,
            )
        stored_task = await self.store.update_task(
            task_id,
            UpdateTaskParams(
                push_notification=request.params.pushNotificationConfig,
            ),
        )
        if stored_task.push_notification is None:
            return SetTaskPushNotificationResponse(
                result=None,
                error=PushNotificationNotSupportedError(),
            )
        return SetTaskPushNotificationResponse(
            result=TaskPushNotificationConfig(
                id=task_id,
                pushNotificationConfig=stored_task.push_notification,
            ),
        )

    async def get_task_push_notification(
        self,
        request: GetTaskPushNotificationRequest,
        request_context: RequestContext | None = None,
    ) -> GetTaskPushNotificationResponse:
        task_id = request.params.id
        task = await self.store.get_task(task_id)
        if task is None:
            return GetTaskPushNotificationResponse(
                result=None,
                error=TaskNotFoundError(),
            )
        if task.push_notification is None:
            return GetTaskPushNotificationResponse(
                result=None,
                error=PushNotificationNotSupportedError(),
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
    ) -> AsyncIterable[SendTaskStreamingResponse] | JSONRPCResponse:
        task_id_params = request.params
        try:
            subscriber_identifier = str(uuid.uuid4())
            await self.queue.add_subscriber(
                task_id_params.id,
                subscriber_identifier,
                is_resubscribe=True,
                caller_id=(
                    request_context.caller_id if request_context is not None else None
                ),
            )
            return await self.dequeue_task_events(
                request.id,
                task_id_params.id,
                subscriber_identifier,
            )
        except Exception as e:
            logger.error(f"Error while reconnecting to SSE stream: {e}")
            return JSONRPCResponse(
                id=request.id,
                error=InternalError(
                    message=f"An error occurred while reconnecting to stream: {e}"
                ),
            )

    @staticmethod
    def _check_caller_id(
        task: StoredTask, request_context: RequestContext | None
    ) -> TaskNotFoundError | None:
        if request_context is not None:
            if task.caller_id != request_context.caller_id:
                return TaskNotFoundError()
        return None

    async def dequeue_task_events(
        self, request_id: int | str | None, task_id: str, subscriber_identifier: str
    ) -> AsyncIterable[SendTaskStreamingResponse] | JSONRPCResponse:
        try:
            return self.try_dequeue_task_events(
                request_id, task_id, subscriber_identifier
            )

        except Exception as e:
            return JSONRPCResponse(id=request_id, error=InternalError(message=str(e)))

    async def try_dequeue_task_events(
        self, request_id: str | int | None, task_id: str, subscriber_identifier: str
    ) -> AsyncIterable[SendTaskStreamingResponse]:

        while True:
            event = await self.queue.dequeue(task_id, subscriber_identifier)
            if isinstance(event, JSONRPCError):
                await self.queue.remove_subscriber(task_id, subscriber_identifier)
                yield SendTaskStreamingResponse(
                    jsonrpc="2.0",
                    id=request_id,
                    result=None,
                    error=event,
                )
                break
            if isinstance(event, TaskStatusUpdateEvent):
                yield SendTaskStreamingResponse(
                    jsonrpc="2.0",
                    id=request_id,
                    result=event,
                    error=None,
                )
                if event.final:
                    await self.queue.remove_subscriber(task_id, subscriber_identifier)
                    break
            if isinstance(event, TaskArtifactUpdateEvent):
                yield SendTaskStreamingResponse(
                    jsonrpc="2.0",
                    id=request_id,
                    result=event,
                    error=None,
                )
