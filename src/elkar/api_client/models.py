from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from elkar.a2a_types import (
    Artifact,
    Message,
    PushNotificationConfig,
    Task,
    TaskEvent,
    TaskPushNotificationConfig,
    TaskSendParams,
    TaskState,
    TaskStatus,
)
from elkar.store.base import TaskType


class CreateTaskInput(BaseModel):
    counterparty_identifier: Optional[str] = None
    send_task_params: TaskSendParams
    task_type: Optional[TaskType] = None


class TaskResponse(BaseModel):
    a2a_task: Optional[Task] = None
    created_at: datetime
    id: UUID
    push_notification: Optional[TaskPushNotificationConfig] = None
    state: TaskState
    task_type: TaskType

    updated_at: datetime
    counterparty_identifier: Optional[str] = None


class GetTaskQueryParams(BaseModel):
    history_length: Optional[int] = None
    caller_id: Optional[str] = None


class UpdateTaskInput(BaseModel):
    status: Optional[TaskStatus] = None
    artifacts_updates: Optional[list[Artifact]] = None
    new_messages: Optional[list[Message]] = None
    push_notification: Optional[PushNotificationConfig] = None
    caller_id: Optional[str] = None


class EnqueueTaskEventInput(BaseModel):
    task_id: str
    event: TaskEvent
    caller_id: Optional[str] = None


class DequeueTaskEventInput(BaseModel):
    task_id: str
    subscriber_id: str
    limit: Optional[int] = None


class TaskEventResponse(BaseModel):
    id: UUID
    task_id: str
    event_data: TaskEvent


class UnpaginatedOutput(BaseModel):
    records: list[TaskEventResponse]


class CreateTaskSubscriberRequest(BaseModel):
    task_id: str
    subscriber_id: str
    caller_id: Optional[str] = None


class UpsertTaskA2AInput(BaseModel):
    task: Task
    counterparty_identifier: Optional[str] = None
    server_agent_url: str
