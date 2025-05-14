from elkar.a2a_types import (
    Artifact,
    Message,
    Task,
    TaskArtifactUpdateEvent,
    TaskSendParams,
    TaskStatus,
    TaskStatusUpdateEvent,
)
from elkar.store.base import TaskManagerStore, UpdateTaskParams
from elkar.store.in_memory import upsert_artifact
from elkar.task_modifier.base import TaskModifierBase
from elkar.task_queue.base import TaskEventManager


class TaskModifier[S: TaskManagerStore, Q: TaskEventManager](TaskModifierBase):
    def __init__(
        self,
        task: Task,
        send_params: TaskSendParams | None = None,
        store: S | None = None,
        queue: Q | None = None,
        caller_id: str | None = None,
    ) -> None:
        self._task = task
        self._send_params = send_params
        self._store = store
        self._queue = queue
        self._caller_id = caller_id

    async def get_send_params(self) -> TaskSendParams | None:
        return self._send_params

    async def get_task(self, from_store: bool = False) -> Task:
        if from_store and self._store:
            stored_task = await self._store.get_task(task_id=self._task.id, caller_id=self._caller_id)
            if stored_task is None:
                raise ValueError("Task not found")
            return stored_task.task
        return self._task

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
        for artifact in artifacts:
            await upsert_artifact(self._task, artifact)
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
