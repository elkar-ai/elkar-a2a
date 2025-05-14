from datetime import datetime
from enum import Enum
from typing import Generic, TypeVar

from pydantic import BaseModel


class ListTasksRequest(BaseModel):
    pass


class TaskType(str, Enum):
    OUTGOING = "outgoing"
    INCOMING = "incoming"


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
