from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Set, AsyncGenerator, Any, AsyncIterable
import asyncio
import logging
from uuid import uuid4

from elkar.a2a_types import (
    Message,
    Task,
    TaskState,
    TaskStatus,
    TaskStatusUpdateEvent,
    TaskArtifactUpdateEvent,
    TextPart,
    Artifact,
    TaskSendParams,
    TaskQueryParams,
    TaskIdParams,
    PushNotificationConfig,
    TaskPushNotificationConfig,
    JSONRPCError,
    JSONRPCResponse,
    SendTaskRequest,
    SendTaskResponse,
    GetTaskRequest,
    GetTaskResponse,
    SendTaskStreamingRequest,
    SendTaskStreamingResponse,
    SetTaskPushNotificationRequest,
    SetTaskPushNotificationResponse,
    GetTaskPushNotificationRequest,
    GetTaskPushNotificationResponse,
    AgentCard,
)
from elkar.client.a2a_client import A2AClient, A2AClientConfig
from elkar.store.base import (
    TaskManagerStore,
    StoredTask,
    UpdateTaskParams,
    ListTasksParams,
)
from elkar.store.in_memory import InMemoryTaskManagerStore
from elkar.task_queue.base import TaskEventManager, TaskEvent
from elkar.task_queue.in_memory import InMemoryTaskEventQueue

logger = logging.getLogger(__name__)


@dataclass
class TaskManagerConfig:
    """Configuration for the task manager."""

    client_config: Optional[A2AClientConfig] = None
    store: Optional[TaskManagerStore] = None


class ClientTaskManager:
    """Manages tasks for the A2A client."""

    def __init__(self, config: TaskManagerConfig):
        self.config = config
        self._store = config.store or InMemoryTaskManagerStore()
        self._client = A2AClient(config.client_config or A2AClientConfig(base_url=""))
        self._cleanup_task: Optional[asyncio.Task] = None

    async def get_agent_card(self) -> AgentCard:
        """Get the agent card from the server."""
        return await self._client.get_agent_card()

    async def send_task(self, request: SendTaskRequest) -> SendTaskResponse:
        """Send a task to the server."""
        try:
            # Create task locally first
            stored_task = await self._store.upsert_task(request.params)

            # Send task to server
            response = await self._client.send_task(request.params)

            if response.result:
                # Update local task with server response
                await self._store.update_task(
                    stored_task.id,
                    UpdateTaskParams(
                        status=response.result.status,
                        new_messages=(
                            [response.result.status.message]
                            if response.result.status.message
                            else None
                        ),
                    ),
                )

            return SendTaskResponse(
                jsonrpc="2.0",
                id=request.id,
                result=response.result,
                error=response.error,
            )
        except Exception as e:
            logger.error(f"Error sending task: {e}")
            return SendTaskResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error=JSONRPCError(code=-32000, message=str(e)),
            )

    async def get_task(self, request: GetTaskRequest) -> GetTaskResponse:
        """Get a task from the server."""
        try:
            # If not found locally, request from server
            response = await self._client.get_task(request.params)
            if response.result and response.result.status.message:
                # Store task locally
                await self._store.upsert_task(
                    TaskSendParams(
                        id=response.result.id,
                        message=response.result.status.message,
                        metadata=response.result.metadata or {},
                    )
                )

            return GetTaskResponse(
                jsonrpc="2.0",
                id=request.id,
                result=response.result,
                error=response.error,
            )
        except Exception as e:
            logger.error(f"Error getting task: {e}")
            return GetTaskResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error=JSONRPCError(code=-32000, message=str(e)),
            )

    async def send_task_streaming(
        self, request: SendTaskStreamingRequest
    ) -> AsyncIterable[SendTaskStreamingResponse]:
        """Send a task to the server with streaming response."""
        try:
            # Create task locally first
            stored_task = await self._store.upsert_task(request.params)

            # Send task to server with streaming
            stream = await self._client.send_task_streaming(request.params)
            async for response in stream:
                if response.result:
                    # Update local task with server response
                    if isinstance(response.result, TaskStatusUpdateEvent):
                        await self._store.update_task(
                            stored_task.id,
                            UpdateTaskParams(
                                status=response.result.status,
                                new_messages=(
                                    [response.result.status.message]
                                    if response.result.status.message
                                    else None
                                ),
                            ),
                        )
                    elif isinstance(response.result, TaskArtifactUpdateEvent):
                        await self._store.update_task(
                            stored_task.id,
                            UpdateTaskParams(
                                artifacts_updates=[response.result.artifact],
                            ),
                        )
                yield SendTaskStreamingResponse(
                    jsonrpc="2.0",
                    id=request.id,
                    result=response.result,
                    error=response.error,
                )
        except Exception as e:
            logger.error(f"Error sending streaming task: {e}")
            yield SendTaskStreamingResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error=JSONRPCError(code=-32000, message=str(e)),
            )

    async def set_task_push_notification(
        self, request: SetTaskPushNotificationRequest
    ) -> SetTaskPushNotificationResponse:
        """Set push notification configuration for a task."""
        try:
            # Update local task
            stored_task = await self._store.update_task(
                request.params.id,
                UpdateTaskParams(
                    push_notification=request.params.pushNotificationConfig,
                ),
            )

            # Send to server
            response = await self._client.set_task_push_notification(request.params)
            return SetTaskPushNotificationResponse(
                jsonrpc="2.0",
                id=request.id,
                result=response.result,
                error=response.error,
            )
        except Exception as e:
            logger.error(f"Error setting push notification: {e}")
            return SetTaskPushNotificationResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error=JSONRPCError(code=-32000, message=str(e)),
            )

    async def get_task_push_notification(
        self, request: GetTaskPushNotificationRequest
    ) -> GetTaskPushNotificationResponse:
        """Get push notification configuration for a task."""
        try:
            response = await self._client.get_task_push_notification(request.params)
            if response.result:
                # Update local task
                await self._store.update_task(
                    request.params.id,
                    UpdateTaskParams(
                        push_notification=response.result.pushNotificationConfig,
                    ),
                )

            return GetTaskPushNotificationResponse(
                jsonrpc="2.0",
                id=request.id,
                result=response.result,
                error=response.error,
            )
        except Exception as e:
            logger.error(f"Error getting push notification: {e}")
            return GetTaskPushNotificationResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error=JSONRPCError(code=-32000, message=str(e)),
            )

    async def cancel_task(self, request: TaskIdParams) -> None:
        """Cancel a task."""
        stored_task = await self._store.get_task(request.id)
        if not stored_task:
            raise ValueError(f"Task {request.id} not found")

        if stored_task.task.status.state in [
            TaskState.COMPLETED,
            TaskState.FAILED,
            TaskState.CANCELED,
        ]:
            return

        params = TaskIdParams(id=request.id)
        updated_task = await self._client.cancel_task(params)
