from elkar.a2a_types import TaskEvent
from elkar.api_client.client import ElkarClient
from elkar.api_client.models import (
    CreateTaskSubscriberRequest,
    DequeueTaskEventInput,
    EnqueueTaskEventInput,
)


class ElkarClientTaskQueue:
    def __init__(self, base_url: str, api_key: str | None = None) -> None:
        self.elkar_client = ElkarClient(base_url=base_url, api_key=api_key)

    async def add_subscriber(
        self,
        task_id: str,
        subscriber_identifier: str,
        is_resubscribe: bool = False,
        caller_id: str | None = None,
    ) -> None:
        await self.elkar_client.create_task_subscriber(
            CreateTaskSubscriberRequest(
                task_id=task_id,
                subscriber_id=subscriber_identifier,
                caller_id=caller_id,
            )
        )

    async def remove_subscriber(
        self,
        task_id: str,
        subscriber_identifier: str,
        caller_id: str | None = None,
    ) -> None:
        return None  # TODO code the logic in the backend

    async def enqueue(
        self,
        task_id: str,
        event: TaskEvent,
        caller_id: str | None = None,
    ) -> None:
        await self.elkar_client.enqueue_task_event(
            EnqueueTaskEventInput(
                task_id=task_id,
                event=event,
                caller_id=caller_id,
            )
        )
        return None

    async def dequeue(
        self,
        task_id: str,
        subscriber_identifier: str,
        caller_id: str | None = None,
    ) -> TaskEvent | None:
        output = await self.elkar_client.dequeue_task_event(
            DequeueTaskEventInput(
                task_id=task_id,
                subscriber_id=subscriber_identifier,
                limit=1,
            )
        )
        if len(output.records) == 0:
            return None
        return output.records[0].event_data
