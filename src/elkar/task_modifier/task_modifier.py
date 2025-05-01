from elkar.a2a_types import (
    Artifact,
    Message,
    Task,
    TaskArtifactUpdateEvent,
    TaskStatus,
    TaskStatusUpdateEvent,
)
from elkar.store.base import TaskManagerStore, UpdateTaskParams
from elkar.task_modifier.base import TaskModifierBase
from elkar.task_queue.base import TaskEventManager


class TaskModifier[S: TaskManagerStore, Q: TaskEventManager](TaskModifierBase):
    def __init__(
        self,
        task: Task,
        store: S | None = None,
        queue: Q | None = None,
        caller_id: str | None = None,
    ) -> None:
        self._task = task
        self._store = store
        self._queue = queue
        self._caller_id = caller_id

    async def set_status(self, status: TaskStatus, is_final: bool = False) -> None:
        self._task.status = status
        if self._store:
            await self._store.update_task(
                self._task.id,
                params=UpdateTaskParams(status=status, caller_id=self._caller_id),
            )
        if self._queue:
            await self._queue.enqueue(
                self._task.id,
                TaskStatusUpdateEvent(
                    id=self._task.id,
                    status=status,
                    final=is_final,
                ),
                caller_id=self._caller_id,
            )

    async def add_messages_to_history(self, messages: list[Message]) -> None:
        if self._task.history is None:
            self._task.history = []
        self._task.history.extend(messages)
        if self._store:
            await self._store.update_task(
                self._task.id,
                params=UpdateTaskParams(new_messages=messages),
            )

    async def upsert_artifacts(self, artifacts: list[Artifact]) -> None:
        if self._store:
            await self._store.update_task(
                self._task.id,
                params=UpdateTaskParams(artifacts_updates=artifacts),
            )
        if self._queue:
            for artifact in artifacts:
                await self._queue.enqueue(
                    self._task.id,
                    TaskArtifactUpdateEvent(
                        id=self._task.id,
                        artifact=artifact,
                    ),
                    caller_id=self._caller_id,
                )
