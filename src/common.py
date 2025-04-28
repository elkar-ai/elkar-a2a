from datetime import datetime
from a2a_types import PushNotificationConfig, Task, TaskState
from pydantic import BaseModel


class ListTasksRequest(BaseModel):
    pass


class Error(BaseModel):
    message: str


class Pagination(BaseModel):
    page: int
    page_size: int
    total: int | None


class PaginatedResponse[T](BaseModel):
    items: list[T]
    pagination: Pagination


class TaskResponse(BaseModel):
    id: str
    caller_id: str
    created_at: datetime
    updated_at: datetime
    state: TaskState
    task: Task
    notification: PushNotificationConfig | None
