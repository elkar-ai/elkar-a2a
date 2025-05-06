from dataclasses import dataclass
from fastapi import FastAPI

from elkar.store.base import TaskManagerStore


app = FastAPI()


@dataclass
class ApiRequestContext:
    store: TaskManagerStore
