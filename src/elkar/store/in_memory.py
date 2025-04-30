import asyncio
from datetime import datetime
import logging

from elkar.a2a_types import (
    Artifact,
    Task,
    TaskSendParams,
    TaskState,
    TaskStatus,
)
from elkar.common import PaginatedResponse, Pagination
from elkar.store.base import (
    ListTasksOrder,
    ListTasksParams,
    StoredTask,
    TaskManagerStore,
    UpdateTaskParams,
)


logger = logging.getLogger(__name__)


class InMemoryTaskManagerStore(TaskManagerStore):
    def __init__(self) -> None:
        self.tasks: dict[str, StoredTask] = {}
        self.lock = asyncio.Lock()

    async def upsert_task(
        self, params: TaskSendParams, caller_id: str | None = None
    ) -> StoredTask:
        async with self.lock:
            task = self.tasks.get(params.id)
            if task is not None:
                if task.session_id != params.sessionId:
                    raise ValueError(
                        f"Task {params.id} is already owned by session {task.session_id}"
                    )
                if task.caller_id != caller_id:
                    raise ValueError(
                        f"Task {params.id} is already owned by caller {task.caller_id}"
                    )
                if task.task.history is None:
                    task.task.history = []
                task.task.history.append(params.message)
                task.task.status = TaskStatus(
                    state=TaskState.SUBMITTED,
                    message=None,
                    timestamp=datetime.now(),
                )
                task.updated_at = datetime.now()
                return task
            self.tasks[params.id] = StoredTask(
                id=params.id,
                caller_id=caller_id,
                session_id=params.sessionId,
                task=Task(
                    id=params.id,
                    status=TaskStatus(
                        state=TaskState.SUBMITTED,
                        message=params.message,
                        timestamp=datetime.now(),
                    ),
                    sessionId=params.sessionId,
                    history=[params.message],
                    metadata=params.metadata,
                ),
                push_notification=params.pushNotification,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            return self.tasks[params.id]

    async def get_task(
        self,
        task_id: str,
        history_length: int | None = None,
        caller_id: str | None = None,
    ) -> StoredTask:
        async with self.lock:
            if task_id not in self.tasks:
                raise ValueError(f"Task {task_id} does not exist")
            return self.tasks[task_id]

    async def update_task(self, task_id: str, params: UpdateTaskParams) -> StoredTask:
        async with self.lock:
            mutable_task = self.tasks[task_id].task
            if task_id not in self.tasks:
                raise ValueError(f"Task {task_id} does not exist")
            if params.caller_id is not None:
                if self.tasks[task_id].caller_id != params.caller_id:
                    raise ValueError(
                        f"Task {task_id} is not owned by caller {params.caller_id}"
                    )
            if params.status is not None:
                mutable_task.status = params.status
            if params.new_messages is not None:
                if mutable_task.history is None:
                    mutable_task.history = []
                mutable_task.history.extend(params.new_messages)
            if params.metadata is not None:
                mutable_task.metadata = params.metadata
            if params.artifacts_updates is not None:
                for artifact in params.artifacts_updates:
                    await self._upsert_artifact(mutable_task, artifact)

            if params.push_notification is not None:
                self.tasks[task_id].push_notification = params.push_notification
            self.tasks[task_id].updated_at = datetime.now()
            return self.tasks[task_id]

    async def _upsert_artifact(self, task: Task, artifact: Artifact) -> None:
        if task.artifacts is None:
            task.artifacts = []
        for existing_artifact in task.artifacts:
            if existing_artifact.index == artifact.index:
                if existing_artifact.lastChunk == True:
                    raise ValueError(
                        f"Artifact {existing_artifact.index} is already a last chunk"
                    )
                existing_artifact.parts.extend(artifact.parts)
                existing_artifact.lastChunk = artifact.lastChunk
                return
        task.artifacts.append(artifact)

    async def list_tasks(
        self, params: ListTasksParams
    ) -> PaginatedResponse[StoredTask]:
        async with self.lock:
            task_values = list(self.tasks.values())
            if params.caller_id is not None:
                task_values = [
                    task for task in task_values if task.caller_id == params.caller_id
                ]
            if params.state_in is not None:
                task_values = [
                    task
                    for task in task_values
                    if task.task.status.state in params.state_in
                ]
            if params.order_by == ListTasksOrder.CREATED_AT:
                task_values.sort(key=lambda x: x.created_at)
            elif params.order_by == ListTasksOrder.UPDATED_AT:
                task_values.sort(key=lambda x: x.updated_at)
            page_size = params.page_size or 100
            page = params.page or 1
            list_values = task_values[(page - 1) * page_size : page * page_size]
            return PaginatedResponse(
                items=list_values,
                pagination=Pagination(
                    page=page,
                    page_size=page_size,
                    total=len(task_values),
                ),
            )
