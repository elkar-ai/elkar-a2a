from abc import abstractmethod
from dataclasses import dataclass
from typing import Any, AsyncIterable, Protocol

from crewai import Agent

from elkar.a2a_types import (
    AgentCard,
    CancelTaskRequest,
    CancelTaskResponse,
    GetTaskPushNotificationRequest,
    GetTaskPushNotificationResponse,
    GetTaskRequest,
    GetTaskResponse,
    JSONRPCResponse,
    SendTaskRequest,
    SendTaskResponse,
    SendTaskStreamingRequest,
    SendTaskStreamingResponse,
    SetTaskPushNotificationRequest,
    SetTaskPushNotificationResponse,
    TaskResubscriptionRequest,
)
from elkar.task_manager.task_manager_base import TaskManager
from elkar.task_manager.task_manager_with_task_modifier import TaskManagerWithModifier
from elkar.task_modifier.base import TaskModifierBase


@dataclass
class RequestContext:
    caller_id: str | None
    metadata: dict[str, Any]


class CrewAITaskManager(TaskManagerWithModifier):
    def __init__(self, crew_agent: Agent, agent_card: AgentCard):
        self.crew_agent = crew_agent

        self.agent_card = agent_card

    def crew_task_handler(self, t: TaskModifierBase, request_context: RequestContext) -> None:
        pass
