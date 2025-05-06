from dataclasses import dataclass
from typing import Any, AsyncIterable, Optional, Dict
import aiohttp
import json

from pydantic import BaseModel

from elkar.a2a_types import (
    AgentCard,
    TaskIdParams,
    TaskQueryParams,
    TaskSendParams,
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
    TaskPushNotificationConfig,
)
from elkar.client.base import A2AClientBase


@dataclass
class A2AClientConfig:
    """Configuration for the A2A client."""

    base_url: str
    headers: Optional[Dict[str, str]] = None
    timeout: int | None = 300


class A2AClient(A2AClientBase):
    """Client for interacting with A2A protocol servers."""

    def __init__(self, config: A2AClientConfig):
        self.config = config
        self._session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self._session = aiohttp.ClientSession(
            headers=self.config.headers,
            timeout=aiohttp.ClientTimeout(total=self.config.timeout),
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._session:
            await self._session.close()
            self._session = None

    async def _make_request(
        self,
        method: str,
        endpoint: Optional[str] = None,
        data: BaseModel | None = None,
    ) -> Dict[str, Any]:
        """Make an HTTP request to the A2A server."""
        if not self._session:
            raise RuntimeError(
                "Client session not initialized. Use 'async with' context manager."
            )

        url = f"{self.config.base_url.rstrip('/')}"
        if endpoint:
            url = f"{url}/{endpoint.lstrip('/')}"
        async with self._session.request(method, url, json=data) as response:
            response.raise_for_status()
            return await response.json()

    async def get_agent_card(self) -> AgentCard:
        """Get the agent card from the server."""
        response = await self._make_request("GET", "/.well-known/agent.json")
        return AgentCard(**response)

    async def get_task(self, task_params: TaskQueryParams) -> GetTaskResponse:
        """Get task details by ID."""
        request = GetTaskRequest(params=task_params)
        response = await self._make_request("POST", data=request)
        return GetTaskResponse(**response)

    async def send_task(self, task_params: TaskSendParams) -> SendTaskResponse:
        """Send a new task to the server."""
        request = SendTaskRequest(
            params=task_params,
        )
        response = await self._make_request("POST", data=request)
        return SendTaskResponse(**response)

    async def _stream_response(
        self, response: aiohttp.ClientResponse
    ) -> AsyncIterable[SendTaskStreamingResponse]:
        async for line in response.content:
            if line:
                event_data = json.loads(line.decode("utf-8"))
                yield SendTaskStreamingResponse(**event_data)

    async def send_task_streaming(
        self, task_params: TaskSendParams
    ) -> AsyncIterable[SendTaskStreamingResponse]:
        """Send a task with streaming response."""
        request = SendTaskStreamingRequest(params=task_params)

        if not self._session:
            raise RuntimeError(
                "Client session not initialized. Use 'async with' context manager."
            )

        async with self._session.post(self.config.base_url, json=request) as response:
            response.raise_for_status()
            return self._stream_response(response)

    async def cancel_task(self, task_params: TaskIdParams) -> CancelTaskResponse:
        """Cancel a running task."""
        request = CancelTaskRequest(params=task_params)
        response = await self._make_request("POST", data=request)
        return CancelTaskResponse(**response)

    async def set_task_push_notification(
        self, task_params: TaskPushNotificationConfig
    ) -> SetTaskPushNotificationResponse:
        """Set push notification configuration for a task."""
        request = SetTaskPushNotificationRequest(params=task_params)
        response = await self._make_request("POST", data=request)
        return SetTaskPushNotificationResponse(**response)

    async def get_task_push_notification(
        self, task_params: TaskIdParams
    ) -> GetTaskPushNotificationResponse:
        """Get push notification configuration for a task."""
        request = GetTaskPushNotificationRequest(params=task_params)
        response = await self._make_request("POST", data=request)
        return GetTaskPushNotificationResponse(**response)

    async def resubscribe_to_task(
        self, task_params: TaskIdParams
    ) -> AsyncIterable[SendTaskStreamingResponse]:
        """Resubscribe to task events."""
        request = TaskResubscriptionRequest(params=task_params)

        if not self._session:
            raise RuntimeError(
                "Client session not initialized. Use 'async with' context manager."
            )

        async with self._session.post(self.config.base_url, json=request) as response:
            response.raise_for_status()

            return self._stream_response(response)
