from abc import abstractmethod

from typing import AsyncIterable, Protocol


from elkar.a2a_types import (
    AgentCard,
    TaskIdParams,
    TaskQueryParams,
    TaskSendParams,
    GetTaskResponse,
    CancelTaskResponse,
    SendTaskResponse,
    SendTaskStreamingResponse,
    SetTaskPushNotificationResponse,
    GetTaskPushNotificationResponse,
    TaskPushNotificationConfig,
)


class A2AClientBase(Protocol):
    @abstractmethod
    async def get_agent_card(self) -> AgentCard:
        """Get the agent card from the server."""
        pass

    @abstractmethod
    async def get_task(self, task_params: TaskQueryParams) -> GetTaskResponse:
        """Get task details by ID."""
        pass

    @abstractmethod
    async def send_task(self, task_params: TaskSendParams) -> SendTaskResponse:
        """Send a new task to the server."""
        pass

    @abstractmethod
    async def send_task_streaming(
        self, task_params: TaskSendParams
    ) -> AsyncIterable[SendTaskStreamingResponse]:
        """Send a task with streaming response."""
        pass

    @abstractmethod
    async def cancel_task(self, task_params: TaskIdParams) -> CancelTaskResponse:
        """Cancel a running task."""
        pass

    @abstractmethod
    async def set_task_push_notification(
        self, task_params: TaskPushNotificationConfig
    ) -> SetTaskPushNotificationResponse:
        """Set push notification configuration for a task."""
        pass

    @abstractmethod
    async def get_task_push_notification(
        self, task_params: TaskIdParams
    ) -> GetTaskPushNotificationResponse:
        """Get push notification configuration for a task."""
        pass

    @abstractmethod
    async def resubscribe_to_task(
        self, task_params: TaskIdParams
    ) -> AsyncIterable[SendTaskStreamingResponse]:
        """Resubscribe to task events."""
        pass
