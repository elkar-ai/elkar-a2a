import asyncio
from elkar.a2a_types import *
from elkar.api_server import app as api_app
from elkar.server.server import A2AServer
from elkar.store.elkar_client_store import ElkarClientStore
from elkar.task_manager.task_manager_base import RequestContext
from elkar.task_manager.task_manager_with_task_modifier import TaskManagerWithModifier
from elkar.task_modifier.base import TaskModifierBase


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


async def task_handler(
    task: TaskModifierBase, request_context: RequestContext | None
) -> None:

    await task.set_status(
        TaskStatus(
            state=TaskState.WORKING,
            message=Message(
                role="agent",
                parts=[TextPart(text="I understand the task, I'm working on it...")],
            ),
        )
    )

    await asyncio.sleep(0.5)
    await task.upsert_artifacts(
        [
            Artifact(
                parts=[TextPart(text="I've finished the task, here is the result...")],
                index=0,
            )
        ]
    )

    await task.set_status(
        TaskStatus(
            state=TaskState.COMPLETED,
            message=Message(
                role="agent",
                parts=[TextPart(text="I've finished the task!")],
            ),
        ),
        is_final=True,
    )


api_key = "sk_elkar_mpqVMKB7S4+PYbKe3DsTUR/x2Plo0O/vQHIUJF7HL6Q="

task_manager: TaskManagerWithModifier = TaskManagerWithModifier(
    agent_card,
    send_task_handler=task_handler,
)

server = A2AServer(task_manager)

api = api_app
# Expose the Starlette application instance
app = server.app
