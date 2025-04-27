from a2a_types import *
from server.server import A2AServer
from task_manager.task_manager_base import (
    InMemoryClientTaskManagerBackend,
    TaskManagerWithStore,
)

store = InMemoryClientTaskManagerBackend()


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
async def send_task(request: TaskSendParams) -> Task:
    return Task(
        id=request.id,
        sessionId=request.sessionId,
        status=TaskStatus(
            state=TaskState.COMPLETED,
            message=None,
            timestamp=datetime.now(),
        ),
        metadata=request.metadata,
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


server = A2AServer(task_manager, host="0.0.0.0", port=5001, endpoint="/")


server.start()
