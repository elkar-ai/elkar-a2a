# Task Queue

> **Real-time task updates for your agent system.**

The **Task Queue** lets you stream task progress and results to clients in real time using Server-Sent Events (SSE). It's designed for developers who want to build responsive, event-driven APIs.

---

## Key Concepts
- **Events:** Task status changes, artifact updates, and errors are sent as events.
- **Subscribers:** Each client gets its own event stream for a task.
- **Streaming:** Used by the server to push updates to the frontend or API clients.

---

## Quickstart: In-Memory Task Queue
```python
from elkar.task_queue.in_memory import InMemoryTaskEventQueue
queue = InMemoryTaskEventQueue()
```

---

## Common Patterns

### 1. Subscribe to Task Events
Register a client to receive updates for a task:
```python
await queue.add_subscriber(task_id="task-123", subscriber_identifier="client-abc")
```

### 2. Enqueue an Event
Send a status or artifact update to all subscribers:
```python
from elkar.a2a_types import TaskStatusUpdateEvent
await queue.enqueue(task_id="task-123", event=TaskStatusUpdateEvent(...))
```

### 3. Stream Events to a Client (SSE)
In your server or handler, stream events as they arrive:
```python
async def stream_events(task_id, subscriber_id):
    while True:
        event = await queue.dequeue(task_id, subscriber_id)
        yield event  # Send to client (e.g., via SSE)
```

---

## Integration Example

**With a Task Manager and Server:**
```python
from elkar.server.server import A2AServer
from elkar.task_manager.task_manager_with_store import TaskManagerWithStore
from elkar.task_queue.in_memory import InMemoryTaskEventQueue

queue = InMemoryTaskEventQueue()
task_manager = TaskManagerWithStore(..., queue=queue)
server = A2AServer(task_manager=task_manager)
server.start()
```

---

## Interface Reference
```python
class TaskEventManager(Protocol):
    async def add_subscriber(task_id, subscriber_identifier, ...): ...
    async def remove_subscriber(task_id, subscriber_identifier, ...): ...
    async def enqueue(task_id, event, ...): ...
    async def dequeue(task_id, subscriber_identifier, ...): ...
```

---

## See Also
- [Task Manager](task_manager.md)
- [Server](server.md) 