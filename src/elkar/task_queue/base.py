from abc import abstractmethod
from typing import Protocol
from elkar.a2a_types import *


TaskEvent = TaskStatusUpdateEvent | TaskArtifactUpdateEvent | JSONRPCError


class TaskEventManager(Protocol):
    """
    A manager for task events.
    A task event manager is responsible for sending events to subscribers.
    """

    @abstractmethod
    async def add_subscriber(
        self,
        task_id: str,
        subscriber_identifier: str,
        is_resubscribe: bool = False,
        caller_id: str | None = None,
    ) -> None: ...

    @abstractmethod
    async def remove_subscriber(
        self,
        task_id: str,
        subscriber_identifier: str,
        caller_id: str | None = None,
    ) -> None: ...

    @abstractmethod
    async def enqueue(
        self,
        task_id: str,
        event: TaskEvent,
        caller_id: str | None = None,
    ) -> None: ...

    @abstractmethod
    async def dequeue(
        self,
        task_id: str,
        subscriber_identifier: str,
        caller_id: str | None = None,
    ) -> TaskEvent: ...
