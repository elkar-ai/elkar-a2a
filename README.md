# Elkar
**Elkar is an open-source task-management layer for AI agents** — based on Google's Agent2Agent Protocol (A2A).

**Send, track, and orchestrate tasks** across AI agents — effortlessly.

[Website](https://elkar.co) &nbsp;&nbsp;&nbsp; [💬 Discord](https://discord.gg/f5Znhcvm) &nbsp;&nbsp;&nbsp; [Open Issues](https://github.com/elkar-ai/elkar/issues) &nbsp;&nbsp;&nbsp; [Open PRs](https://github.com/elkar-ai/elkar/pulls)

## ✨ What is Elkar? 

Elkar helps developers build collaborative, autonomous multi-agent systems without the complexity of managing infrastructure.

Elkar provides:
- 🐍 A Python package to build and connect AI agents using the A2A protocol.
- 🖥️ A web-based UI to manage/debug tasks, history, and agent interactions (see in [a2a-client](https://github.com/elkar-ai/elkar/tree/main/a2a-client)).

By simplifying agent orchestration, Elkar eliminates silos and lets you focus on what matters: making your agents work together.

Whether you’re debugging agent behaviors or streaming tasks — Elkar makes it easy.


## 🔧 What can you do with Elkar?
Make your agents work together — even outside your org.
Use it to:
- **Track and manage long-running tasks** (sync or async)
- **Debug agent tasks** with full history and artifacts
- **Stream tasks** between agents in real-time
- **Browse and manage task history** for observability and debugging
- **Collaborate** across teams, tech stacks — or even organizations


**Disclaimer:** This project is still in early development.

![Elkar](./images/ui.png)

### Applications:
- Consistent task management for AI agents
- Task orchestration between agents
- Task history for observability and debugging


## 📦 Python Package

The Python package provides a simple implementation of the A2A protocol for building and connecting AI agents. It includes:
- Full A2A protocol implementation
- Task-oriented. Built to focus on running tasks, not the infrastructure.
- Built-in and simplified task management with queue and store
- Support for streaming responses 
- Custom authentication via `RequestContext`


### Basic Usage

1. **Install dependencies**
```bash
pip install elkar
```

2. **Create an agent and run it!**
```python
from elkar.a2a_types import *
from elkar.server.server import A2AServer
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


task_manager: TaskManagerWithModifier = TaskManagerWithModifier(
    agent_card, send_task_handler=task_handler
)

# Create the server instance but don't start it
server = A2AServer(task_manager, host="0.0.0.0", port=5001, endpoint="/")

server.start()
```


### Supported task updates


1. **Status Update**

Describes the state of the task and the agent's progress. Messages in the status are appended to the task's history.

```python
await task.set_status(
    TaskStatus(
        state=TaskState.COMPLETED,
        message=Message(parts=[TextPart(text="I've finished the task!")])
    )
)
```

2. **Artifact Update**

Artifacts represent the result of the task. Indices are used to identify artifacts within a task. Updates append to existing artifacts if the index matches and the chunk is not the last one.

```python
await task.upsert_artifact(
    Artifact(parts=[TextPart(text="I've finished the task!")], index=0)
)
```

3. **Append Messages to History**

Stores relevant information, such as thoughts or past communications, related to the task. ([elkarbackup/elkarbackup-docker - GitHub](https://github.com/elkarbackup/elkarbackup-docker?utm_source=chatgpt.com))

```python
await task.add_messages_to_history(
    [Message(parts=[TextPart(text="I'm working on the task...")])]
)
```




### 📚 Roadmap
- Full Documentation
- Task stores:
    - PostgreSQL, Redis, Hosted
- Task queues:
    - PostgreSQL, Redis, Hosted
- Tests and code samples
- Push notifications support
- Task history search functionality
- Integration with Model Context Protocol (MCP) for enhanced task management.

## 💬 Community
Join our [Discord server](https://discord.gg/f5Znhcvm) to get help, share ideas, and get updates

## 🤝 Contribute

We ❤️ feedback, PRs, and ideas! Here's how to help:

- If you find Elkar useful, a GitHub ⭐️ would mean a lot! — it helps to support the project!
- Report bugs or request features via [issues](https://github.com/elkar-ai/elkar/issues).
- Show off what you’ve built with Elkar [here](https://discord.com/channels/1366517666054934589/1366528135730040862)! 
- Submit [pull requests](https://github.com/elkar-ai/elkar/pulls), and we'll review it as soon as possible.

##  🙌 Thanks
Elkar is powered by community collaboration and inspired by Google’s A2A protocol.

Join us in building a better ecosystem for AI agent workflows.

## 🔒 License  
This project is licensed under the MIT License – see the [LICENSE](https://github.com/elkar-ai/elkar-a2a/blob/main/LICENCE) file for details.



