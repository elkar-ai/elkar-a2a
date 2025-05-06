from elkar.a2a_types import Task, TaskSendParams
from elkar.api_client.client import ElkarClient

from elkar.api_client.models import (
    CreateTaskInput,
    GetTaskQueryParams,
    TaskResponse,
    UpdateTaskInput,
)
from elkar.common import PaginatedResponse
from elkar.store.base import (
    CreateTaskForClientParams,
    ListTasksParams,
    StoredTask,
    TaskManagerStore,
    TaskType,
    UpdateStoredTaskClient,
    UpdateTaskParams,
)


def convert_task(task: TaskResponse) -> StoredTask:
    if task.a2a_task is None:
        raise ValueError("Task response is None")
    return StoredTask(
        id=task.a2a_task.id,
        caller_id=task.counterparty_identifier,
        task_type=TaskType.INCOMING,
        is_streaming=False,
        task=task.a2a_task,
        push_notification=task.push_notification,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


class ElkarClientStore(TaskManagerStore):
    def __init__(self, base_url: str, api_key: str | None = None) -> None:
        self.client = ElkarClient(base_url=base_url, api_key=api_key)

    async def upsert_task(
        self, task: TaskSendParams, is_streaming: bool, caller_id: str | None = None
    ) -> StoredTask:
        task_input = CreateTaskInput(
            send_task_params=task,
            task_type=TaskType.INCOMING,
            counterparty_identifier=caller_id,
        )
        task_response = await self.client.upsert_task(task_input)
        if task_response.a2a_task is None:
            raise ValueError("Task response is None")

        return StoredTask(
            id=task_response.a2a_task.id,
            caller_id=caller_id,
            task_type=TaskType.INCOMING,
            is_streaming=is_streaming,
            task=task_response.a2a_task,
            push_notification=None,
            created_at=task_response.created_at,
            updated_at=task_response.updated_at,
        )

    async def get_task(
        self,
        task_id: str,
        history_length: int | None = None,
        caller_id: str | None = None,
    ) -> StoredTask | None:
        query_params = GetTaskQueryParams(
            history_length=history_length,
            caller_id=caller_id,
        )
        task_response = await self.client.get_task(task_id, query_params)
        if task_response is None:
            return None
        if task_response.a2a_task is None:
            return None

        return convert_task(task_response)

    async def update_task(self, task_id: str, params: UpdateTaskParams) -> StoredTask:
        task_input = UpdateTaskInput(
            status=params.status,
            artifacts_updates=params.artifacts_updates,
            new_messages=params.new_messages,
            push_notification=params.push_notification,
            caller_id=params.caller_id,
        )
        task_response = await self.client.update_task(task_id, task_input)
        if task_response.a2a_task is None:
            raise ValueError("Task response is None")

        return convert_task(task_response)

    async def list_tasks(
        self, params: ListTasksParams
    ) -> PaginatedResponse[StoredTask]:
        """
        List tasks with the following rules:
        - If caller_id is provided, return the tasks only if the caller_id matches
        """
        raise NotImplementedError("Not implemented")

    async def update_task_for_client(
        self, task_id: str, params: UpdateStoredTaskClient
    ) -> StoredTask:
        """
        Update the task for the client with the following rules:
        - If the task does not exist, raise an error
        """
        raise NotImplementedError("Not implemented")

    async def create_task_for_client(
        self, task: CreateTaskForClientParams
    ) -> StoredTask:
        """
        Create a task for the client with the following rules:
        """
        raise NotImplementedError("Not implemented")
