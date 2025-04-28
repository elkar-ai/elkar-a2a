from abc import abstractmethod
from datetime import datetime

from typing import (
    AsyncIterable,
    Awaitable,
    Callable,
)

from a2a_types import (
    AgentCard,
    Task,
    TaskArtifactUpdateEvent,
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
)


from common import ListTasksRequest, PaginatedResponse
from store.base import ListTasksParams, StoredTask, TaskManagerStore, UpdateTaskParams
from task_manager.task_manager_base import RequestContext, TaskManager

import logging

logger = logging.getLogger(__name__)


class TaskManagerWithStore[T: TaskManagerStore](TaskManager):
    def __init__(self, store: T, agent_card: AgentCard):
        self.store = store
        self.agent_card = agent_card
        self._send_task_handler: (
            Callable[
                [Task, RequestContext | None, TaskManagerStore | None], Awaitable[Task]
            ]
            | None
        ) = None

        self._send_task_streaming_handler: (
            Callable[
                [Task, RequestContext | None, TaskManagerStore | None],
                AsyncIterable[SendTaskStreamingResponse],
            ]
            | None
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
        stored_task = await self.store.get_task(request.params.id)
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

    async def send_task(
        self, request: SendTaskRequest, request_context: RequestContext | None = None
    ) -> SendTaskResponse:
        if self._send_task_handler is None:
            raise ValueError("send_task_handler is not set")
        params = request.params

        stored_task = await self.store.upsert_task(
            params,
            caller_id=(
                request_context.caller_id if request_context is not None else None
            ),
        )
        task_response = await self._send_task_handler(
            stored_task.task, request_context, self.store
        )

        updated_task = await self.store.update_task(
            stored_task.id,
            UpdateTaskParams(
                status=task_response.status,
                artifacts=task_response.artifacts,
                caller_id=(
                    request_context.caller_id if request_context is not None else None
                ),
            ),
        )

        return SendTaskResponse(
            jsonrpc="2.0",
            id=None,
            result=updated_task.task,
            error=None,
        )

    def send_task_handler(
        self,
    ) -> Callable[
        ...,
        Callable[
            [Task, RequestContext | None, TaskManagerStore | None], Awaitable[Task]
        ],
    ]:
        """Decorator to handle common logic for sending tasks, like storing."""

        def decorator(
            fn: Callable[
                [Task, RequestContext | None, TaskManagerStore | None], Awaitable[Task]
            ],
        ) -> Callable[
            [Task, RequestContext | None, TaskManagerStore | None], Awaitable[Task]
        ]:
            self._send_task_handler = fn
            return fn

        return decorator

    def send_task_streaming_handler(self):
        """Decorator to handle common logic for sending tasks, like streaming."""

        def decorator(
            fn: Callable[
                [Task, RequestContext | None, TaskManagerStore | None],
                AsyncIterable[SendTaskStreamingResponse],
            ],
        ) -> Callable[
            [Task, RequestContext | None, TaskManagerStore | None],
            AsyncIterable[SendTaskStreamingResponse],
        ]:
            self._send_task_streaming_handler = fn
            return fn

        return decorator

    async def _send_task_streaming(
        self,
        request: SendTaskStreamingRequest,
        request_context: RequestContext | None = None,
    ) -> AsyncIterable[SendTaskStreamingResponse]:
        """
        The protocol defines this method to return an AsyncIterable.
        We implement it as an async iterator function that yields responses.
        """
        caller_id = request_context.caller_id if request_context is not None else None

        if self._send_task_streaming_handler is None:
            raise ValueError("send_task_streaming_handler is not set")

        # Convert the awaitable AsyncIterable to an actual AsyncIterable
        stored_task = await self.store.upsert_task(request.params)
        current_task = stored_task.task
        async for response in self._send_task_streaming_handler(
            current_task, request_context, self.store
        ):
            if isinstance(response.result, TaskStatusUpdateEvent):
                await self.store.update_task(
                    stored_task.id,
                    UpdateTaskParams(
                        status=response.result.status,
                        artifacts=None,
                        caller_id=caller_id,
                    ),
                )
                if response.result.final:
                    break
            elif isinstance(response.result, TaskArtifactUpdateEvent):
                await self.store.update_task(
                    stored_task.id,
                    UpdateTaskParams(
                        status=None,
                        artifacts=[response.result.artifact],
                        caller_id=caller_id,
                    ),
                )

            yield response

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
        if not self.agent_card.capabilities.pushNotifications:
            return SetTaskPushNotificationResponse(
                result=None, error=PushNotificationNotSupportedError()
            )
        task_id = request.params.id
        task = await self.store.get_task(task_id)
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

    @staticmethod
    def _check_caller_id(
        task: StoredTask, request_context: RequestContext | None
    ) -> TaskNotFoundError | None:
        if request_context is not None:
            if task.caller_id != request_context.caller_id:
                return TaskNotFoundError()
        return None

    async def list_tasks(self, request: ListTasksRequest) -> PaginatedResponse[Task]:
        params = ListTasksParams()
        return await self.store.list_tasks(params)
