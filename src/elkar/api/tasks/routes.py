from ast import Store
from multiprocessing import get_context
from fastapi import APIRouter, Depends


from fastapi import FastAPI
from pydantic import BaseModel
from elkar.app_sample import app
from elkar.a2a_types import TaskState
from elkar.api.tasks.schemas import TaskParams
from elkar.common import PaginatedResponse, Pagination

from elkar.store.base import ListTasksParams, StoredTask, TaskManagerStore
from elkar.store.in_memory import InMemoryTaskManagerStore


@app.get("/tasks")
async def retrieve_tasks(
    task_params: TaskParams = Depends(),
    context: ApiRequestContext = Depends(get_context),
) -> PaginatedResponse[StoredTask]:
    params = ListTasksParams(
        state_in=task_params.status_in,
        order_by=task_params.order_by,
        page=task_params.page,
        page_size=task_params.page_size,
    )
    tasks: PaginatedResponse[StoredTask] = await context.store.list_tasks(params)
    task_responses = [
        TaskResponse(
            id=task.id,
            caller_id=task.caller_id,
            created_at=task.created_at,
            updated_at=task.updated_at,
            state=task.state,
            task=task.task,
            notification=task.push_notification,
        )
        for task in tasks.items
    ]
    return PaginatedResponse(
        items=task_responses,
        pagination=Pagination(
            total=len(task_responses),
            page=1,
            page_size=len(task_responses),
        ),
    )
