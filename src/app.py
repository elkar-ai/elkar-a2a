import asyncio
import logging
from typing import AsyncIterable
from a2a_types import *
import colorlog
from server.server import A2AServer
from store.base import TaskManagerStore
from task_manager.task_manager_base import RequestContext
from task_manager.task_manager_with_store import (
    TaskManagerWithStore,
)
from store.in_memory import InMemoryClientTaskManagerBackend

store = InMemoryClientTaskManagerBackend()

handler = colorlog.StreamHandler()
handler.setFormatter(
    colorlog.ColoredFormatter(
        "%(log_color)s%(levelname)s%(reset)s - %(asctime)s - %(name)s - %(funcName)s - %(pathname)s:%(lineno)d - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        log_colors={
            "DEBUG": "cyan",
            "INFO": "green",
            "WARNING": "yellow",
            "ERROR": "red",
            "CRITICAL": "red,bg_white",
        },
    )
)

logger = logging.getLogger()
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)

agent_card = AgentCard(
    name="Test Agent",
    description="Test Agent Description",
    url="https://example.com",
    version="1.0.0",
    skills=[],
    capabilities=AgentCapabilities(
        streaming=True,
        pushNotifications=True,
        stateTransitionHistory=True,
    ),
)

task_manager = TaskManagerWithStore(store, agent_card)


@task_manager.send_task_handler()
async def send_task(
    task: Task, request_context: RequestContext | None, store: TaskManagerStore | None
) -> Task:
    return Task(
        id=task.id,
        sessionId=task.sessionId,
        status=TaskStatus(
            state=TaskState.COMPLETED,
            message=None,
            timestamp=datetime.now(),
        ),
        metadata=task.metadata,
        artifacts=[
            Artifact(
                parts=[
                    TextPart(
                        text="Hello, world!",
                    )
                ],
            )
        ],
        history=None,
    )


@task_manager.send_task_streaming_handler()
async def send_task_streaming(
    task: Task, request_context: RequestContext | None, store: TaskManagerStore | None
) -> AsyncIterable[SendTaskStreamingResponse]:
    yield SendTaskStreamingResponse(
        result=TaskStatusUpdateEvent(
            id=task.id,
            status=TaskStatus(
                state=TaskState.WORKING,
                message=None,
            ),
            metadata=task.metadata,
            final=False,
        ),
    )

    await asyncio.sleep(1)

    yield SendTaskStreamingResponse(
        result=TaskArtifactUpdateEvent(
            id=task.id,
            artifact=Artifact(
                index=0,
                parts=[
                    TextPart(text="Hello, world!"),
                    TextPart(text="Hello, world!"),
                ],
            ),
            metadata=task.metadata,
        ),
    )

    await asyncio.sleep(1)

    yield SendTaskStreamingResponse(
        result=TaskArtifactUpdateEvent(
            id=task.id,
            artifact=Artifact(
                index=0,
                parts=[
                    TextPart(text="Hello, world!"),
                    TextPart(text="Hello, world!"),
                ],
            ),
            metadata={},
        ),
    )

    await asyncio.sleep(1)

    yield SendTaskStreamingResponse(
        result=TaskArtifactUpdateEvent(
            id=task.id,
            artifact=Artifact(
                name="test",
                description="test",
                index=1,
                parts=[
                    TextPart(text="Hello, world!"),
                    TextPart(text="Hello, world!"),
                ],
            ),
            metadata=task.metadata,
        ),
    )

    await asyncio.sleep(1)

    yield SendTaskStreamingResponse(
        result=TaskStatusUpdateEvent(
            id=task.id,
            status=TaskStatus(state=TaskState.COMPLETED, message=None),
            metadata=task.metadata,
        ),
    )


# Create the server instance but don't start it
server = A2AServer(task_manager, host="0.0.0.0", port=5001, endpoint="/")

# Expose the Starlette application instance
app = server.app
