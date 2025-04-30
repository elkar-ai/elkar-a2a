"""
Elkar - The open-source protocol to send, track, and orchestrate tasks between AI agents
"""

from elkar.app import (
    app,
    server,
    task_manager,
    send_task,
    send_task_streaming,
    store,
    queue,
    agent_card,
)
from elkar.a2a_types import (
    Task,
    TaskStatus,
    TaskState,
    AgentCard,
    AgentCapabilities,
    Artifact,
    TextPart,
    Message,
    SendTaskStreamingResponse,
    TaskStatusUpdateEvent,
    TaskArtifactUpdateEvent,
)
from elkar.store.base import TaskManagerStore
from elkar.store.in_memory import InMemoryTaskManagerStore
from elkar.task_queue.in_memory import InMemoryTaskEventQueue
from elkar.task_manager.task_manager_base import RequestContext
from elkar.task_manager.task_manager_with_store import (
    TaskManagerWithStore,
    TaskSendOutput,
)

__version__ = "0.1.4"

__all__ = [
    "app",
    "server",
    "task_manager",
    "send_task",
    "send_task_streaming",
    "store",
    "queue",
    "agent_card",
    "Task",
    "TaskStatus",
    "TaskState",
    "TaskSendOutput",
    "RequestContext",
    "AgentCard",
    "AgentCapabilities",
    "Artifact",
    "TextPart",
    "Message",
    "SendTaskStreamingResponse",
    "TaskStatusUpdateEvent",
    "TaskArtifactUpdateEvent",
    "TaskManagerStore",
    "InMemoryTaskManagerStore",
    "InMemoryTaskEventQueue",
    "TaskManagerWithStore",
]
