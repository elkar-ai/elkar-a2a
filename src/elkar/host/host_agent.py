from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, AsyncGenerator
import asyncio
import logging
import aiohttp
import json
from uuid import uuid4

from elkar.a2a_types import (
    AgentCard,
    Artifact,
    Message,
    Task,
    TaskArtifactUpdateEvent,
    TaskSendParams,
    TaskState,
    TaskStatus,
    TaskStatusUpdateEvent,
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
    TextPart,
    TaskIdParams,
    TaskQueryParams,
    JSONRPCError,
)

logger = logging.getLogger(__name__)


@dataclass
class HostAgentConfig:
    """Configuration for the host agent."""

    name: str
    description: str
    version: str
    base_url: str
    agent_registry_urls: List[str]  # URLs of agent registries to discover agents from


class HostAgent:
    """Host agent implementation that interfaces between humans and AI agents."""

    def __init__(self, config: HostAgentConfig):
        self.config = config
        self._tasks: Dict[str, Task] = {}
        self._subscribers: Dict[str, Set[str]] = {}  # task_id -> set of subscriber_ids
        self._push_notifications: Dict[str, TaskPushNotificationConfig] = {}
        self._conversation_history: Dict[str, List[Message]] = {}  # user_id -> messages
        self._discovered_agents: Dict[str, AgentCard] = {}  # agent_url -> agent_card
        self._agent_sessions: Dict[str, aiohttp.ClientSession] = {}

    async def initialize(self):
        """Initialize the host agent by discovering available agents."""
        async with aiohttp.ClientSession() as session:
            for registry_url in self.config.agent_registry_urls:
                try:
                    async with session.get(
                        f"{registry_url}/.well-known/agent.json"
                    ) as response:
                        if response.status == 200:
                            agent_card = await response.json()
                            self._discovered_agents[registry_url] = AgentCard(
                                **agent_card
                            )
                except Exception as e:
                    logger.error(f"Failed to discover agent at {registry_url}: {e}")

    def get_agent_card(self) -> AgentCard:
        """Get the agent card describing this host's capabilities."""
        return AgentCard(
            name=self.config.name,
            description=self.config.description,
            version=self.config.version,
            url=self.config.base_url,
            capabilities={},  # Host agent doesn't have capabilities
            skills=[],  # Host agent doesn't have skills
        )

    async def handle_user_message(
        self, user_id: str, message: str
    ) -> AsyncGenerator[Message, None]:
        """Handle a message from a user and coordinate with appropriate agents."""
        # Initialize conversation history if needed
        if user_id not in self._conversation_history:
            self._conversation_history[user_id] = []

        # Add user message to history
        user_message = Message(role="user", parts=[TextPart(text=message)])
        self._conversation_history[user_id].append(user_message)

        # Analyze message to determine which agent(s) to use
        selected_agent = await self._select_agent(message)

        if not selected_agent:
            yield Message(
                role="agent",
                parts=[
                    TextPart(
                        text="I'm sorry, I couldn't find an appropriate agent to handle your request."
                    )
                ],
            )
            return

        # Create a task for the selected agent
        task_id = str(uuid4())
        task = Task(
            id=task_id,
            status=TaskStatus(
                state=TaskState.SUBMITTED,
                message=user_message,
                timestamp=datetime.now(),
            ),
            history=[user_message],
            artifacts=[],
            metadata={"user_id": user_id},
        )
        self._tasks[task_id] = task

        try:
            # Send task to the selected agent
            async for response in self._process_with_agent(selected_agent, task):
                # Add agent's response to conversation history
                self._conversation_history[user_id].append(response)
                yield response

        except Exception as e:
            logger.exception(f"Error processing message with agent: {e}")
            error_message = Message(
                role="agent",
                parts=[
                    TextPart(
                        text=f"I encountered an error while processing your request: {str(e)}"
                    )
                ],
            )
            self._conversation_history[user_id].append(error_message)
            yield error_message

    async def _select_agent(self, message: str) -> Optional[AgentCard]:
        """Select the most appropriate agent for the given message."""
        # TODO: Implement more sophisticated agent selection logic
        # For now, we'll just return the first agent that has matching skills
        for agent_url, agent_card in self._discovered_agents.items():
            # Check if agent has relevant skills for the message
            # This is a simple example - you would want to implement more sophisticated matching
            if any(skill.name in message.lower() for skill in agent_card.skills):
                return agent_card
        return None

    async def _process_with_agent(
        self, agent_card: AgentCard, task: Task
    ) -> AsyncGenerator[Message, None]:
        """Process a task with the selected agent."""
        # Get or create a session for this agent
        if agent_card.url not in self._agent_sessions:
            self._agent_sessions[agent_card.url] = aiohttp.ClientSession()

        session = self._agent_sessions[agent_card.url]

        # Create a request to send to the agent
        request = SendTaskStreamingRequest(
            jsonrpc="2.0",
            id=str(uuid4()),
            params=TaskSendParams(
                id=task.id, message=task.history[-1], metadata=task.metadata
            ),
        )

        try:
            # Send request to agent
            async with session.post(
                f"{agent_card.url}/send_task_streaming", json=request.dict()
            ) as response:
                if response.status != 200:
                    raise Exception(f"Agent returned status {response.status}")

                # Stream the response
                async for line in response.content:
                    if line:
                        try:
                            event = json.loads(line)
                            if "result" in event:
                                if "status" in event["result"]:
                                    yield Message(
                                        role="agent",
                                        parts=[
                                            TextPart(
                                                text=event["result"]["status"].get(
                                                    "message", ""
                                                )
                                            )
                                        ],
                                    )
                        except json.JSONDecodeError:
                            continue

        except Exception as e:
            logger.exception(f"Error communicating with agent: {e}")
            raise

    async def get_conversation_history(self, user_id: str) -> List[Message]:
        """Get the conversation history for a user."""
        return self._conversation_history.get(user_id, [])

    async def handle_get_task(self, request: GetTaskRequest) -> GetTaskResponse:
        """Handle get task request."""
        task_id = request.params.id
        if task_id not in self._tasks:
            return GetTaskResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error={"code": -32000, "message": "Task not found"},
            )
        return GetTaskResponse(
            jsonrpc="2.0", id=request.id, result=self._tasks[task_id]
        )

    async def handle_send_task(self, request: SendTaskRequest) -> SendTaskResponse:
        """Handle send task request."""
        task_id = request.params.id
        if task_id in self._tasks:
            return SendTaskResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error={"code": -32000, "message": "Task already exists"},
            )

        # Create new task
        task = Task(
            id=task_id,
            status=TaskStatus(
                state=TaskState.SUBMITTED, message=None, timestamp=datetime.now()
            ),
            history=[request.params.message],
            artifacts=[],
            metadata=request.params.metadata or {},
        )

        self._tasks[task_id] = task

        # Start task processing in background
        asyncio.create_task(self._process_task(task_id))

        return SendTaskResponse(jsonrpc="2.0", id=request.id, result=task)

    async def handle_send_task_streaming(
        self, request: SendTaskStreamingRequest
    ) -> AsyncGenerator[SendTaskStreamingResponse, None]:
        """Handle streaming task request."""
        task_id = request.params.id
        subscriber_id = str(uuid4())

        if task_id not in self._tasks:
            yield SendTaskStreamingResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error={"code": -32000, "message": "Task not found"},
            )
            return

        # Add subscriber
        if task_id not in self._subscribers:
            self._subscribers[task_id] = set()
        self._subscribers[task_id].add(subscriber_id)

        try:
            # Send initial task status
            yield SendTaskStreamingResponse(
                jsonrpc="2.0",
                id=request.id,
                result=TaskStatusUpdateEvent(
                    task_id=task_id, status=self._tasks[task_id].status, final=False
                ),
            )

            # Process task and stream updates
            async for event in self._process_task_streaming(task_id):
                yield SendTaskStreamingResponse(
                    jsonrpc="2.0", id=request.id, result=event
                )

        finally:
            # Cleanup subscriber
            if task_id in self._subscribers:
                self._subscribers[task_id].discard(subscriber_id)
                if not self._subscribers[task_id]:
                    del self._subscribers[task_id]

    async def handle_cancel_task(
        self, request: CancelTaskRequest
    ) -> CancelTaskResponse:
        """Handle cancel task request."""
        task_id = request.params.id
        if task_id not in self._tasks:
            return CancelTaskResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error={"code": -32000, "message": "Task not found"},
            )

        task = self._tasks[task_id]
        if task.status.state in [
            TaskState.COMPLETED,
            TaskState.FAILED,
            TaskState.CANCELED,
        ]:
            return CancelTaskResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error={"code": -32000, "message": "Task cannot be canceled"},
            )

        # Update task status
        task.status = TaskStatus(
            state=TaskState.CANCELED, message=None, timestamp=datetime.now()
        )

        # Notify subscribers
        await self._notify_subscribers(
            task_id,
            TaskStatusUpdateEvent(task_id=task_id, status=task.status, final=True),
        )

        return CancelTaskResponse(jsonrpc="2.0", id=request.id)

    async def handle_set_task_push_notification(
        self, request: SetTaskPushNotificationRequest
    ) -> SetTaskPushNotificationResponse:
        """Handle set push notification request."""
        if not self.config.capabilities.get("pushNotifications", False):
            return SetTaskPushNotificationResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error={"code": -32000, "message": "Push notifications not supported"},
            )

        task_id = request.params.id
        if task_id not in self._tasks:
            return SetTaskPushNotificationResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error={"code": -32000, "message": "Task not found"},
            )

        self._push_notifications[task_id] = request.params.pushNotificationConfig

        return SetTaskPushNotificationResponse(
            jsonrpc="2.0",
            id=request.id,
            result=TaskPushNotificationConfig(
                id=task_id, pushNotificationConfig=request.params.pushNotificationConfig
            ),
        )

    async def handle_get_task_push_notification(
        self, request: GetTaskPushNotificationRequest
    ) -> GetTaskPushNotificationResponse:
        """Handle get push notification request."""
        task_id = request.params.id
        if task_id not in self._push_notifications:
            return GetTaskPushNotificationResponse(
                jsonrpc="2.0",
                id=request.id,
                result=None,
                error={"code": -32000, "message": "Push notification not found"},
            )

        return GetTaskPushNotificationResponse(
            jsonrpc="2.0",
            id=request.id,
            result=TaskPushNotificationConfig(
                id=task_id, pushNotificationConfig=self._push_notifications[task_id]
            ),
        )

    async def _process_task(self, task_id: str) -> None:
        """Process a task in the background."""
        try:
            task = self._tasks[task_id]

            # Update status to working
            task.status = TaskStatus(
                state=TaskState.WORKING, message=None, timestamp=datetime.now()
            )

            # TODO: Implement actual task processing logic here
            # This is where you would integrate with your agent's business logic

            # For now, just mark as completed
            task.status = TaskStatus(
                state=TaskState.COMPLETED,
                message=Message(
                    role="agent", parts=[TextPart(text="Task completed successfully")]
                ),
                timestamp=datetime.now(),
            )

        except Exception as e:
            logger.exception(f"Error processing task {task_id}")
            if task_id in self._tasks:
                self._tasks[task_id].status = TaskStatus(
                    state=TaskState.FAILED,
                    message=Message(
                        role="agent", parts=[TextPart(text=f"Task failed: {str(e)}")]
                    ),
                    timestamp=datetime.now(),
                )

    async def _process_task_streaming(
        self, task_id: str
    ) -> AsyncGenerator[TaskStatusUpdateEvent | TaskArtifactUpdateEvent, None]:
        """Process a task with streaming updates."""
        try:
            task = self._tasks[task_id]

            # Update status to working
            task.status = TaskStatus(
                state=TaskState.WORKING, message=None, timestamp=datetime.now()
            )
            yield TaskStatusUpdateEvent(
                task_id=task_id, status=task.status, final=False
            )

            # TODO: Implement actual task processing logic here
            # This is where you would integrate with your agent's business logic
            # and yield status/artifact updates as they occur

            # For now, just mark as completed
            task.status = TaskStatus(
                state=TaskState.COMPLETED,
                message=Message(
                    role="agent", parts=[TextPart(text="Task completed successfully")]
                ),
                timestamp=datetime.now(),
            )
            yield TaskStatusUpdateEvent(task_id=task_id, status=task.status, final=True)

        except Exception as e:
            logger.exception(f"Error processing streaming task {task_id}")
            if task_id in self._tasks:
                self._tasks[task_id].status = TaskStatus(
                    state=TaskState.FAILED,
                    message=Message(
                        role="agent", parts=[TextPart(text=f"Task failed: {str(e)}")]
                    ),
                    timestamp=datetime.now(),
                )
                yield TaskStatusUpdateEvent(
                    task_id=task_id, status=self._tasks[task_id].status, final=True
                )

    async def _notify_subscribers(
        self, task_id: str, event: TaskStatusUpdateEvent | TaskArtifactUpdateEvent
    ) -> None:
        """Notify all subscribers of a task about an event."""
        if task_id not in self._subscribers:
            return

        # TODO: Implement actual notification logic here
        # This would typically involve sending events to each subscriber
        # through their respective channels (e.g., WebSocket, SSE, etc.)
        pass

    async def cleanup(self):
        """Clean up resources."""
        for session in self._agent_sessions.values():
            await session.close()
        self._agent_sessions.clear()
