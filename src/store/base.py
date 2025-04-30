from abc import abstractmethod
from dataclasses import dataclass
from typing import Protocol

from a2a_types import *
from common import PaginatedResponse


@dataclass
class StoredTask:
    id: str
    caller_id: str | None
    session_id: str | None
    task: Task
    push_notification: PushNotificationConfig | None
    created_at: datetime
    updated_at: datetime


@dataclass
class UpdateTaskParams:
    status: TaskStatus | None = None
    artifacts_updates: list[Artifact] | None = None
    new_messages: list[Message] | None = None
    metadata: dict[str, Any] | None = None
    push_notification: PushNotificationConfig | None = None
    caller_id: str | None = None


class ListTasksOrder(str, Enum):
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"


@dataclass
class ListTasksParams:
    caller_id: str | None = None
    state_in: list[TaskState] | None = None
    order_by: ListTasksOrder = ListTasksOrder.CREATED_AT
    page: int | None = 1
    page_size: int | None = 100


class TaskManagerStore(Protocol):

    @abstractmethod
    async def upsert_task(
        self, params: TaskSendParams, caller_id: str | None = None
    ) -> StoredTask:
        """
        Upsert a task. Should create a new task if it doesn't exist, or update an existing task.
        Update rules are as follows:
        - If the task exists:
            - update the status
            - append message to history
            - update metadata
        - If the task does not exist, create a new task with the given params.
        - If the task exists and the caller_id is different, raise an error.
        UpsertTaskParams:
            id: str
            caller_id: str | None
            status: TaskState
            history: list[Message]
            artifacts: list[Artifact]
            metadata: dict[str, Any]
        """
        ...

    @abstractmethod
    async def get_task(
        self,
        task_id: str,
        history_length: int | None = None,
        caller_id: str | None = None,
    ) -> StoredTask:
        """
        Get the task with the following rules:
        - If history_length is provided, return the last N messages
        - If caller_id is provided, return the task only if the caller_id matches
        """
        ...

    @abstractmethod
    async def update_task(
        self,
        task_id: str,
        params: UpdateTaskParams,
    ) -> StoredTask:
        """
        Update the task with the following rules:
        - If status is provided, update the status
        - If artifacts is provided, update the artifacts (i.e. if an artifact with the same index already exists, it will be updated: the only authorized update is to append to the parts list, if the artifact does not exist, it will be created)
        - If caller_id is provided, update the caller_id
        """
        ...

    @abstractmethod
    async def list_tasks(
        self, params: ListTasksParams
    ) -> PaginatedResponse[StoredTask]:
        """
        List tasks with the following rules:
        - If caller_id is provided, return the tasks only if the caller_id matches
        """
        ...
