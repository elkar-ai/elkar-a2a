from abc import abstractmethod
from dataclasses import dataclass
from typing import Protocol

from a2a_types import *


@dataclass
class StoredTask:
    id: str
    caller_id: str | None
    status: TaskState
    push_notification: PushNotificationConfig | None
    task: Task


class TaskManagerStore(Protocol):

    @abstractmethod
    async def create_task(self, task: StoredTask) -> StoredTask: ...

    @abstractmethod
    async def get_task(self, task_id: str) -> StoredTask: ...

    @abstractmethod
    async def update_task(self, task_id: str, task: StoredTask) -> StoredTask: ...

    @abstractmethod
    async def list_tasks(
        self,
    ) -> list[StoredTask]: ...
