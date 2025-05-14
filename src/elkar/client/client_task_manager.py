import logging
from dataclasses import dataclass
from typing import AsyncIterable, Optional

from elkar.a2a_types import (
    AgentCard,
    CancelTaskResponse,
    GetTaskPushNotificationResponse,
    GetTaskRequest,
    GetTaskResponse,
    SendTaskRequest,
    SendTaskResponse,
    SendTaskStreamingResponse,
    SetTaskPushNotificationResponse,
    Task,
    TaskArtifactUpdateEvent,
    TaskIdParams,
    TaskPushNotificationConfig,
    TaskSendParams,
    TaskState,
    TaskStatus,
    TaskStatusUpdateEvent,
)
from elkar.client.a2a_client import A2AClient, A2AClientConfig
from elkar.store.base import ClientSideTaskManagerStore, UpdateTaskParams
from elkar.store.in_memory import (
    InMemoryClientSideTaskManagerStore,
)

logger = logging.getLogger(__name__)


@dataclass
class TaskManagerConfig:
    """Configuration for the task manager."""

    client_config: Optional[A2AClientConfig] = None
    store: Optional[ClientSideTaskManagerStore] = None


class ClientSideTaskManager:
    """Manages tasks for the A2A client."""

    def __init__(self, config: TaskManagerConfig, caller_id: str | None):
        self.config = config
        self._store = config.store or InMemoryClientSideTaskManagerStore()
        self._client = A2AClient(config.client_config or A2AClientConfig(base_url=""))

        self._caller_id = caller_id

    async def get_agent_url(self) -> str:
        """Get the agent URL from the server."""
        return await self._client.get_url()

    async def get_agent_card(self) -> AgentCard:
        """Get the agent card from the server."""
        return await self._client.get_agent_card()

    async def send_task(self, request: SendTaskRequest) -> SendTaskResponse:
        """Send a task to the server."""
        task = await self._store.get_task_for_client(task_id=request.params.id, caller_id=self._caller_id)
        if task is not None and task.task.status.state == TaskState.COMPLETED:
            raise ValueError(f"Task {request.params.id} already completed")
        response = await self._client.send_task(request.params)

        # Send task to server

        if response.result:
            agent_url = await self._client.get_url()
            await self._store.upsert_task_for_client(response.result, agent_url, self._caller_id)

        return SendTaskResponse(
            jsonrpc="2.0",
            id=request.id,
            result=response.result,
            error=response.error,
        )

    async def get_task(self, request: GetTaskRequest) -> GetTaskResponse:
        """Get a task from the server."""
        # If not found locally, request from server
        response = await self._client.get_task(request.params)
        if response.result:
            await self._store.upsert_task_for_client(response.result, await self._client.get_url(), self._caller_id)
        return GetTaskResponse(
            jsonrpc="2.0",
            id=request.id,
            result=response.result,
            error=response.error,
        )

    async def send_task_streaming(self, params: TaskSendParams) -> AsyncIterable[SendTaskStreamingResponse]:
        """Send a task to the server with streaming response."""

        # Create task locally first
        stored_task = await self._store.get_task_for_client(task_id=params.id, caller_id=self._caller_id)
        if stored_task is not None and stored_task.task.status.state == TaskState.COMPLETED:
            raise ValueError("Task is already completed")

        # Send task to server with streaming
        stream = await self._client.send_task_streaming(params)
        task = Task(
            id=params.id,
            status=TaskStatus(
                state=TaskState.SUBMITTED,
                message=params.message,
            ),
        )
        await self._store.upsert_task_for_client(task, await self._client.get_url(), self._caller_id)
        async for response in stream:
            if response.result:
                # Update local task with server response
                if isinstance(response.result, TaskStatusUpdateEvent):
                    await self._store.update_task(
                        task.id,
                        UpdateTaskParams(
                            status=response.result.status,
                            caller_id=self._caller_id,
                        ),
                    )

                elif isinstance(response.result, TaskArtifactUpdateEvent):
                    await self._store.update_task(
                        task.id,
                        UpdateTaskParams(
                            artifacts_updates=[response.result.artifact],
                        ),
                    )

            yield response

    async def set_task_push_notification(self, params: TaskPushNotificationConfig) -> SetTaskPushNotificationResponse:
        raise NotImplementedError()

    async def get_task_push_notification(self, params: TaskIdParams) -> GetTaskPushNotificationResponse:
        """Get push notification configuration for a task."""
        raise NotImplementedError()

    async def cancel_task(self, request: TaskIdParams) -> CancelTaskResponse:
        """Cancel a task."""
        stored_task = await self._store.get_task_for_client(task_id=request.id, caller_id=self._caller_id)
        if not stored_task:
            raise ValueError(f"Task {request.id} not found")

        if stored_task.task.status.state in [
            TaskState.COMPLETED,
            TaskState.FAILED,
            TaskState.CANCELED,
        ]:
            raise ValueError(f"Task {request.id} is already in a terminal state")

        params = TaskIdParams(id=request.id)
        cancel_task_response = await self._client.cancel_task(params)
        if cancel_task_response.result:
            await self._store.upsert_task_for_client(
                cancel_task_response.result,
                await self._client.get_url(),
                self._caller_id,
            )
        return cancel_task_response
