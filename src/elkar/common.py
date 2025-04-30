from datetime import datetime
from typing import Generic, TypeVar
from elkar.a2a_types import PushNotificationConfig, Task, TaskState
from pydantic import BaseModel


class ListTasksRequest(BaseModel):
    pass


class Error(BaseModel):
    message: str


class Pagination(BaseModel):
    page: int
    page_size: int
    total: int | None


DataT = TypeVar("DataT")


class PaginatedResponse(BaseModel, Generic[DataT]):
    items: list[DataT]
    pagination: Pagination


class TaskResponse(BaseModel):
    id: str
    caller_id: str | None
    created_at: datetime
    updated_at: datetime
    state: TaskState
    task: Task
    notification: PushNotificationConfig | None
