from elkar.a2a_types import Task, TaskSendParams
from elkar.api_client.client import ElkarClient
from elkar.api_client.models import (
    CreateTaskInput,
    GetTaskQueryParams,
    TaskResponse,
    UpdateTaskInput,
    UpsertTaskA2AInput,
)
from elkar.common import PaginatedResponse, TaskType
from elkar.store.base import (
    ClientSideTaskManagerStore,
    StoredTask,
    TaskManagerStore,
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
        push_notification=(task.push_notification.pushNotificationConfig if task.push_notification else None),
        created_at=task.created_at,
        updated_at=task.updated_at,
        agent_url=None,
    )


class ElkarClientStore(TaskManagerStore):
    def __init__(self, base_url: str, api_key: str | None = None) -> None:
        self.client = ElkarClient(base_url=base_url, api_key=api_key)

    async def upsert_task(
        self,
        task: TaskSendParams,
        is_streaming: bool = False,
        caller_id: str | None = None,
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
            agent_url=None,
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


class ElkarClientStoreClientSide(ClientSideTaskManagerStore):
    def __init__(self, base_url: str, api_key: str | None = None) -> None:
        # raise NotImplementedError(
        #     "ElkarClientStoreClientSide does not support update_task yet"
        # )
        self.client = ElkarClient(base_url=base_url, api_key=api_key)

    async def upsert_task(self, task: Task, server_agent_url: str, caller_id: str | None = None) -> StoredTask:
        task_input = UpsertTaskA2AInput(
            task=task,
            server_agent_url=server_agent_url,
            counterparty_identifier=caller_id,
        )
        task_response = await self.client.upsert_task_client_side(task_input)
        return convert_task(task_response)

    async def get_task(self, task_id: str) -> StoredTask | None:
        task_response = await self.client.get_task_client_side(task_id)
        if task_response is None:
            return None
        return convert_task(task_response)

    async def update_task(self, task_id: str, params: UpdateTaskParams) -> StoredTask:
        raise NotImplementedError("ElkarClientStoreClientSide does not support update_task")
