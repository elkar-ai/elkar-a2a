import asyncio
from datetime import datetime
import logging


from elkar.task_queue.base import TaskEvent, TaskEventManager


logger = logging.getLogger(__name__)


class InMemoryTaskEventQueue(TaskEventManager):
    def __init__(self) -> None:
        self.task_subscribers: dict[str, dict[str, asyncio.Queue[TaskEvent]]] = {}
        self.lock = asyncio.Lock()

    async def add_subscriber(
        self,
        task_id: str,
        subscriber_identifier: str,
        is_resubscribe: bool = False,
        caller_id: str | None = None,
    ) -> None:

        if task_id not in self.task_subscribers:
            if is_resubscribe:
                raise ValueError(
                    "Cannot resubscribe to a task that is not subscribed to"
                )
            if task_id not in self.task_subscribers:
                self.task_subscribers[task_id] = {}
            self.task_subscribers[task_id][subscriber_identifier] = asyncio.Queue()

    async def remove_subscriber(
        self, task_id: str, subscriber_identifier: str, caller_id: str | None = None
    ) -> None:
        async with self.lock:
            if task_id not in self.task_subscribers:
                raise ValueError("Task not subscribed to")
            if subscriber_identifier not in self.task_subscribers[task_id]:
                raise ValueError("Caller not subscribed to task")
            del self.task_subscribers[task_id][subscriber_identifier]

    async def enqueue(
        self, task_id: str, event: TaskEvent, caller_id: str | None = None
    ) -> None:
        async with self.lock:
            if task_id not in self.task_subscribers:
                raise ValueError("Task not subscribed to")
            for subscriber in self.task_subscribers[task_id]:
                await self.task_subscribers[task_id][subscriber].put(event)

    async def dequeue(
        self,
        task_id: str,
        subscriber_identifier: str,
        caller_id: str | None = None,
    ) -> TaskEvent:
        if task_id not in self.task_subscribers:
            raise ValueError("Task not subscribed to")
        if subscriber_identifier not in self.task_subscribers[task_id]:
            raise ValueError("Subscriber not subscribed to task")
        queue = self.task_subscribers[task_id][subscriber_identifier]
        event = await queue.get()
        return event
