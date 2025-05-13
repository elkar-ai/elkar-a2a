from abc import abstractmethod
from typing import Protocol

from elkar.a2a_types import Artifact, Message, Task, TaskSendParams, TaskStatus


class TaskModifierBase(Protocol):
    @abstractmethod
    async def get_send_params(self) -> TaskSendParams | None: ...
    @abstractmethod
    async def get_task(self, from_store: bool = False) -> Task: ...

    @abstractmethod
    async def set_status(self, status: TaskStatus, is_final: bool = False) -> None: ...

    @abstractmethod
    async def add_messages_to_history(self, messages: list[Message]) -> None: ...

    @abstractmethod
    async def upsert_artifacts(self, artifacts: list[Artifact]) -> None: ...
