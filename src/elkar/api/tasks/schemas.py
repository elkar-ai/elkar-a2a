from dataclasses import dataclass
from fastapi import Query
from pydantic import BaseModel

from elkar.a2a_types import TaskState
from elkar.store.base import ListTasksOrder


@dataclass
class TaskParams(BaseModel):
    status_in: list[TaskState] | None = Query(
        default=None,
        description="Filter tasks by their status",
        alias="status_in",
    )
    order_by: ListTasksOrder = Query(
        default=ListTasksOrder.CREATED_AT,
        description="Order tasks by their creation date",
        alias="order_by",
    )
    page: int = Query(
        default=1,
        description="Page number",
        alias="page",
    )
    page_size: int = Query(
        default=10,
        description="Page size",
        alias="page_size",
    )
