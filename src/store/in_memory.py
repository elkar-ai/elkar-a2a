import asyncio
from store.base import StoredTask, TaskManagerStore


class InMemoryClientTaskManagerBackend(TaskManagerStore):
    def __init__(self):
        self.tasks: dict[str, StoredTask] = {}
        self.lock = asyncio.Lock()

    async def create_task(self, task: StoredTask) -> StoredTask:
        async with self.lock:
            if task.id in self.tasks:
                raise ValueError(f"Task {task.id} already exists")
            self.tasks[task.id] = task
            return task

    async def get_task(self, task_id: str) -> StoredTask:
        async with self.lock:
            if task_id not in self.tasks:
                raise ValueError(f"Task {task_id} does not exist")
            return self.tasks[task_id]

    async def update_task(self, task_id: str, task: StoredTask) -> StoredTask:
        async with self.lock:
            if task_id not in self.tasks:
                raise ValueError(f"Task {task_id} does not exist")
            self.tasks[task_id] = task
            return task

    async def list_tasks(self) -> list[StoredTask]:
        async with self.lock:
            return list(self.tasks.values())
