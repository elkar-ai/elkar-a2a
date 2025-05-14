import asyncio
import logging
from datetime import datetime

from elkar.a2a_types import (
    Artifact,
    Task,
    TaskSendParams,
    TaskState,
    TaskStatus,
)
from elkar.common import TaskType
from elkar.store.base import (
    ClientSideTaskManagerStore,
    StoredTask,
    TaskManagerStore,
    UpdateTaskParams,
)

logger = logging.getLogger(__name__)


class InMemoryTaskManagerStore(TaskManagerStore):
    def __init__(self) -> None:
        self.tasks: dict[str | None, dict[str, StoredTask]] = {}
        self.lock = asyncio.Lock()

    def caller_tasks(self, caller_id: str | None) -> dict[str, StoredTask] | None:
        return self.tasks.get(caller_id)

    async def upsert_task(
        self,
        params: TaskSendParams,
        is_streaming: bool = False,
        caller_id: str | None = None,
    ) -> StoredTask:
        async with self.lock:
            caller_tasks = self.tasks.get(caller_id)
            if caller_tasks is None:
                self.tasks[caller_id] = {}

            task = self.tasks[caller_id].get(params.id)
            if task is not None:
                if task.caller_id != caller_id:
                    raise ValueError(f"Task {params.id} is already owned by caller {task.caller_id}")
                if task.task.history is None:
                    task.task.history = []

                task.task.history.append(params.message)
                task.updated_at = datetime.now()
                return task
            self.tasks[caller_id][params.id] = StoredTask(
                id=params.id,
                caller_id=caller_id,
                task_type=TaskType.INCOMING,
                is_streaming=is_streaming,
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
            print(self.tasks)
            return self.tasks[caller_id][params.id]

    async def get_task(
        self,
        task_id: str,
        history_length: int | None = None,
        caller_id: str | None = None,
    ) -> StoredTask | None:
        async with self.lock:
            caller_tasks = self.caller_tasks(caller_id=caller_id)
            if caller_tasks is None:
                return None
            return caller_tasks.get(task_id)

    async def update_task(self, task_id: str, params: UpdateTaskParams) -> StoredTask:
        return await _update_task(self.lock, self.tasks, task_id, params)


async def _update_task(
    lock: asyncio.Lock,
    tasks: dict[str | None, dict[str, StoredTask]],
    task_id: str,
    params: UpdateTaskParams,
) -> StoredTask:
    async with lock:
        if params.caller_id not in tasks:
            raise ValueError("caller id was not found")
        mutable_task = tasks[params.caller_id][task_id].task
        if task_id not in tasks[params.caller_id]:
            raise ValueError(f"Task {task_id} does not exist")

        if params.status is not None:
            mutable_task.status = params.status
            if mutable_task.history is None:
                mutable_task.history = []
            if params.status.message is not None:
                mutable_task.history.append(params.status.message)
        if params.new_messages is not None:
            if mutable_task.history is None:
                mutable_task.history = []
            mutable_task.history.extend(params.new_messages)
        if params.metadata is not None:
            mutable_task.metadata = params.metadata
        if params.artifacts_updates is not None:
            for artifact in params.artifacts_updates:
                await upsert_artifact(mutable_task, artifact)

        if params.push_notification is not None:
            tasks[params.caller_id][task_id].push_notification = params.push_notification
        tasks[params.caller_id][task_id].updated_at = datetime.now()
        return tasks[params.caller_id][task_id]


async def upsert_artifact(task: Task, artifact: Artifact) -> None:
    if task.artifacts is None:
        task.artifacts = []
    for existing_artifact in task.artifacts:
        if existing_artifact.index == artifact.index:
            if existing_artifact.lastChunk == True:
                raise ValueError(f"Artifact {existing_artifact.index} is already a last chunk")
            existing_artifact.parts.extend(artifact.parts)
            existing_artifact.lastChunk = artifact.lastChunk
            return
    task.artifacts.append(artifact)


class InMemoryClientSideTaskManagerStore(ClientSideTaskManagerStore):
    def __init__(self) -> None:
        self.tasks: dict[str | None, dict[str, StoredTask]] = {}
        self.lock = asyncio.Lock()

    async def upsert_task_for_client(self, task: Task, agent_url: str, caller_id: str | None = None) -> StoredTask:
        async with self.lock:
            task_id = task.id
            caller_tasks = self.tasks.get(caller_id)
            if caller_tasks is None:
                caller_tasks = {}
            curr_task = caller_tasks.get(task_id)
            if curr_task is None:
                caller_tasks[task_id] = StoredTask(
                    id=task_id,
                    task=task,
                    task_type=TaskType.OUTGOING,
                    is_streaming=False,
                    push_notification=None,
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                    caller_id=caller_id,
                    agent_url=agent_url,
                )
                return caller_tasks[task_id]
            if caller_id is not None and curr_task.caller_id != caller_id:
                raise ValueError(f"Task {task_id} is already owned by caller {curr_task.caller_id}")
            elif caller_id is None and curr_task.caller_id is not None:
                raise ValueError(f"Task {task_id} is already owned")
            curr_task.task = task
            curr_task.updated_at = datetime.now()
            curr_task.agent_url = agent_url
            return curr_task

    async def get_task_for_client(self, task_id: str, caller_id: str | None) -> StoredTask | None:
        async with self.lock:
            caller_tasks = self.tasks.get(caller_id)
            if caller_tasks is None:
                return None
            task = caller_tasks.get(task_id)
            if task is not None and task.caller_id == caller_id:
                return task
            return None

    async def update_task(self, task_id: str, params: UpdateTaskParams) -> StoredTask:
        return await _update_task(self.lock, self.tasks, task_id, params)
