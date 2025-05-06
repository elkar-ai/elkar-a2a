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
